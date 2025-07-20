

"use client"

import type { Post, User, Comment } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2, Share2, Star, Dot, Shield, AlertTriangle, Lock } from "lucide-react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { SharePostDialog } from "./share-post-dialog";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PostCardProps {
  post: Post;
  currentUser?: User | null;
  onDelete?: (postId: string, mediaUrl?: string) => void;
  onMakePostPrivate?: (post: Post, offenceCredit: number) => void;
  onMakePostPublic?: (postId: string, newDefenceCredit: number) => void;
  onReact: (postId: string, authorId: string, reaction: 'like' | 'laugh') => void;
  onComment?: (postId: string, commentText: string) => Promise<void>;
  onSharePost: (
    content: string,
    contentBangla: string,
    file: File | null,
    fileBangla: File | null,
    defenceCredit: number,
    localColor: string,
    postType: 'original' | 'share',
    sharedPostId: string
  ) => Promise<void>;
}

function CommentItem({ comment }: { comment: Comment }) {
    const authorInitial = comment.authorName ? comment.authorName.charAt(0) : 'U';
    const timestamp = comment.timestamp?.toDate ? comment.timestamp.toDate() : new Date();

    return (
        <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
                <AvatarImage src={comment.authorPhotoURL ?? undefined} alt={comment.authorName} />
                <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{authorInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(timestamp, { addSuffix: true })}</p>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
            </div>
        </div>
    );
}

function OriginalPostCard({ post }: { post: Post }) {
    const timestamp = post.timestamp?.toDate ? post.timestamp.toDate() : new Date();
    const authorInitial = post.authorName ? post.authorName.charAt(0) : 'U';
    
    return (
        <div className="border rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
                    <AvatarFallback>{authorInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{post.authorName || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                    </p>
                </div>
            </div>
            {post.content && <p className="text-card-foreground text-base mb-4 whitespace-pre-wrap">{post.content}</p>}
            
            {post.mediaURL && (
                <div className="relative w-full rounded-lg mb-4 overflow-hidden aspect-video border">
                    {post.mediaType === 'image' && (
                        <Image src={post.mediaURL} alt="Post media" layout="fill" objectFit="cover" />
                    )}
                    {post.mediaType === 'video' && (
                        <video src={post.mediaURL} controls className="w-full h-full object-cover bg-black" />
                    )}
                </div>
            )}
        </div>
    );
}


function PostCard({ post: initialPost, currentUser, onDelete, onMakePostPrivate, onMakePostPublic, onReact, onComment, onSharePost }: PostCardProps) {
    const [post, setPost] = useState(initialPost);
    const [author, setAuthor] = useState<User | null>(null);
    const [isLoadingAuthor, setIsLoadingAuthor] = useState(true);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [offenceCredit, setOffenceCredit] = useState('');
    const [newDefenceCredit, setNewDefenceCredit] = useState('');


    useEffect(() => {
        if (!carouselApi) return;
        setCurrentSlide(carouselApi.selectedScrollSnap());
        carouselApi.on("select", () => {
            setCurrentSlide(carouselApi.selectedScrollSnap());
        });
    }, [carouselApi]);
    
    useEffect(() => {
        setPost(initialPost);
    }, [initialPost]);

    useEffect(() => {
        const fetchAuthor = async () => {
            if (!db || !post.authorId) return;
            setIsLoadingAuthor(true);
            try {
                const userDocRef = doc(db, 'users', post.authorId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setAuthor(userDocSnap.data() as User);
                }
            } catch (error) {
                console.error("Error fetching post author:", error);
            } finally {
                setIsLoadingAuthor(false);
            }
        };

        fetchAuthor();
    }, [post.authorId]);
    
    useEffect(() => {
        if (post.type === 'share' && post.sharedPostId && !post.sharedPost) {
            const fetchSharedPost = async () => {
                if (!db) return;
                try {
                    const postRef = doc(db, 'posts', post.sharedPostId);
                    const postSnap = await getDoc(postRef);
                    if (postSnap.exists()) {
                        setPost(prevPost => ({
                            ...prevPost,
                            sharedPost: { id: postSnap.id, ...postSnap.data() } as Post
                        }));
                    }
                } catch(error) {
                    console.error("Error fetching shared post", error);
                }
            };
            fetchSharedPost();
        }
    }, [post.type, post.sharedPostId, post.sharedPost]);


    const isSharedPostLoading = post.type === 'share' && post.sharedPostId && !post.sharedPost;

    const timestamp = post.timestamp?.toDate ? post.timestamp.toDate() : new Date();
    const isAuthor = post.authorId === currentUser?.uid;
    const authorInitial = post.authorName ? post.authorName.charAt(0) : 'U';
    const { toast } = useToast();
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);

    const currentUserInitial = currentUser?.name ? currentUser.name.charAt(0) : "U";

    const handleReactionClick = (reaction: 'like' | 'laugh') => {
        if (!currentUser || !onReact) return;
        onReact(post.id, post.authorId, reaction);
    };
    
    const handleCommentClick = () => {
        setIsExpanded(prev => !prev);
    };

    const handleCommentPost = async () => {
        if (!onComment || !commentText.trim()) return;
        setIsCommenting(true);
        try {
            await onComment(post.id, commentText);
            setCommentText(""); // Clear input on success
        } catch (error) {
            // Toast is handled by the parent
        } finally {
            setIsCommenting(false);
        }
    };
    
    const profileLink = isAuthor ? '/profile' : `/u/${post.authorId}`;

    const followersCount = useMemo(() => {
        if (!author || author.followers === undefined) return null;
        const followers = author.followers.length;
        if (followers >= 1000000) return `${(followers / 1000000).toFixed(1)}m`;
        if (followers >= 1000) return `${(followers / 1000).toFixed(1)}k`;
        return `${followers}`;
    }, [author]);

    const laughAnimation = {
        face: {
            y: [0, -4, 0, -2, 0],
            rotate: [0, -5, 5, -2, 0],
            transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
        },
        tear: {
            y: [0, 8, 12],
            opacity: [0, 1, 0],
            transition: { duration: 0.8, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.2 }
        }
    };

    const hasEnglishContent = post.content || post.mediaURL;
    const hasBanglaContent = post.contentBangla || post.mediaURLBangla;
    const hasMultipleSlides = hasEnglishContent && hasBanglaContent;

    const defenceCreditValue = post.defenceCredit || 0;
    const lastOffenceCreditValue = post.offenceCredit || 0;
    const offenceCreditValue = parseInt(offenceCredit, 10) || 0;
    const newDefenceCreditValue = parseInt(newDefenceCredit, 10) || 0;
    const hasEnoughOffenceCredits = (currentUser?.credits || 0) >= offenceCreditValue;
    const hasEnoughNewDefenceCredits = (currentUser?.credits || 0) >= newDefenceCreditValue;
    const isOffenceCreditSufficient = offenceCreditValue > defenceCreditValue;
    const isRepublishCreditSufficient = newDefenceCreditValue > lastOffenceCreditValue;

    const hasLiked = (post.likes || []).includes(currentUser?.uid || '');
    const hasLaughed = (post.laughs || []).includes(currentUser?.uid || '');

    const handleDeleteClick = () => {
        if (onDelete) {
            onDelete(post.id, post.mediaURL);
        }
    };

    const handleMakePrivateClick = () => {
        if (onMakePostPrivate) {
            onMakePostPrivate(post, offenceCreditValue);
        }
    };
    
    const handleMakePublicClick = () => {
        if (isAuthor && onMakePostPublic && newDefenceCreditValue > 0) {
            onMakePostPublic(post.id, newDefenceCreditValue);
        }
    };


    const makePublicDialog = (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button disabled={!isAuthor}>
                    <Lock className="h-4 w-4 text-muted-foreground" title="This post is private" />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Make Post Public</AlertDialogTitle>
                    <AlertDialogDescription>
                        To make this post public again, you must use more than the {lastOffenceCreditValue} credits used to privatize it. Your current total credits: {currentUser?.credits ?? 0}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="new-defence-credit">New Defence Credit</Label>
                    <Input
                        id="new-defence-credit"
                        type="number"
                        placeholder={`Enter more than ${lastOffenceCreditValue}`}
                        value={newDefenceCredit}
                        onChange={(e) => setNewDefenceCredit(e.target.value)}
                    />
                    {!hasEnoughNewDefenceCredits && newDefenceCreditValue > 0 && (
                        <p className="text-xs text-destructive flex items-center justify-start gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            You don't have enough credits.
                        </p>
                    )}
                    {newDefenceCreditValue > 0 && !isRepublishCreditSufficient && (
                        <p className="text-xs text-destructive flex items-center justify-start gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Must be greater than {lastOffenceCreditValue}.
                        </p>
                    )}
                </div>
                <AlertDialogFooter>
                    <Button variant="destructive" onClick={handleDeleteClick}>Delete Permanently</Button>
                    <AlertDialogAction
                        onClick={handleMakePublicClick}
                        disabled={!isRepublishCreditSufficient || !hasEnoughNewDefenceCredits}
                    >
                        Publish Again
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return (
        <>
            <div 
                id={post.id}
                className="bg-card p-6 rounded-2xl w-full max-w-2xl mx-auto shadow-md transition-shadow hover:shadow-lg border-4 border-black relative"
            >
                <div className="flex items-start justify-between space-x-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <Link href={profileLink}>
                          <Avatar className="w-12 h-12 border-2 border-primary/50">
                              <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
                              <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">{authorInitial}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Link href={profileLink}>
                                    <p 
                                      className="font-semibold text-lg hover:underline"
                                      style={{ color: post.localColor || '#FFA500' }}
                                    >
                                      {post.authorName || 'Anonymous'}
                                    </p>
                                </Link>
                                {post.isPrivate && (
                                     isAuthor ? makePublicDialog : <Lock className="h-4 w-4 text-muted-foreground" title="This post is private" />
                                )}
                            </div>
                            {isLoadingAuthor ? (
                                <Skeleton className="h-4 w-24 mt-1" />
                            ) : (
                                followersCount !== null && (
                                    <p className="text-sm text-muted-foreground">{followersCount} followers</p>
                                )
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                    </p>
                </div>
                 
                {(hasEnglishContent || hasBanglaContent) && (
                    <div className="mb-4">
                        <Carousel setApi={setCarouselApi} className="w-full">
                            <CarouselContent>
                                {hasEnglishContent && (
                                    <CarouselItem>
                                        <div className="space-y-4">
                                            {post.content && <p className="font-sans text-card-foreground text-lg whitespace-pre-wrap">{post.content}</p>}
                                            {post.mediaURL && (
                                                <div className="relative w-full rounded-lg overflow-hidden aspect-video border">
                                                    {post.mediaType === 'image' && <Image src={post.mediaURL} alt="Post media" layout="fill" objectFit="cover" />}
                                                    {post.mediaType === 'video' && <video src={post.mediaURL} controls className="w-full h-full object-cover bg-black" />}
                                                </div>
                                            )}
                                        </div>
                                    </CarouselItem>
                                )}
                                {hasBanglaContent && (
                                    <CarouselItem>
                                        <div className="space-y-4">
                                            {post.contentBangla && <p className="font-sans text-card-foreground text-lg whitespace-pre-wrap">{post.contentBangla}</p>}
                                            {post.mediaURLBangla && (
                                                <div className="relative w-full rounded-lg overflow-hidden aspect-video border">
                                                    {post.mediaTypeBangla === 'image' && <Image src={post.mediaURLBangla} alt="Post media (Bangla)" layout="fill" objectFit="cover" />}
                                                    {post.mediaTypeBangla === 'video' && <video src={post.mediaURLBangla} controls className="w-full h-full object-cover bg-black" />}
                                                </div>
                                            )}
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>
                        </Carousel>
                        {hasMultipleSlides && (
                            <div className="flex justify-center items-center mt-2 space-x-1">
                                <Dot className={cn("h-6 w-6 cursor-pointer", currentSlide === 0 ? "text-primary" : "text-muted-foreground")} onClick={() => carouselApi?.scrollTo(0)} />
                                <Dot className={cn("h-6 w-6 cursor-pointer", currentSlide === 1 ? "text-primary" : "text-muted-foreground")} onClick={() => carouselApi?.scrollTo(1)} />
                            </div>
                        )}
                    </div>
                )}


                {post.type === 'share' && post.sharedPost && (
                    <OriginalPostCard post={post.sharedPost} />
                )}
                 {isSharedPostLoading && (
                    <div className="border rounded-lg p-4 mt-4 space-y-4">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 rounded-md" />
                                <Skeleton className="h-3 w-16 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                 )}
                
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center">
                        <Button variant="ghost" size="lg" onClick={() => handleReactionClick('like')} className={cn("flex items-center gap-2", !hasLiked && "text-muted-foreground")}>
                            <Heart className={cn("h-6 w-6", hasLiked && "fill-red-500 text-red-500")} />
                            {post.likes && post.likes.length > 0 && (
                                <span className="font-semibold text-sm">{post.likes.length}</span>
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleReactionClick('laugh')} className={cn(!hasLaughed && "text-muted-foreground")}>
                            <motion.div whileHover="laughing">
                                <motion.svg 
                                    variants={{ laughing: laughAnimation.face }}
                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                                    <circle cx="12" cy="12" r="10" fill={hasLaughed ? '#FFD700' : 'currentColor'} stroke="none" />
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={hasLaughed ? '#333' : 'white'} fill="none" strokeWidth="1.5" />
                                    <path d="M9 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5c0 .828-.672 1.5-1.5 1.5S9 10.328 9 9.5z" fill={hasLaughed ? '#333' : 'white'} stroke="none" />
                                    <path d="M15 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5c0 .828-.672 1.5-1.5 1.5S15 10.328 15 9.5z" fill={hasLaughed ? '#333' : 'white'} stroke="none" />
                                    <motion.path variants={{ laughing: laughAnimation.tear }} d="M6.5 11.5C6.5 12.328 7.172 13 8 13s1.5-.672 1.5-1.5c0-.398-.158-.755-.41-1.031" fill={hasLaughed ? '#3498DB' : 'none'} stroke="none" opacity="0"/>
                                    <motion.path variants={{ laughing: laughAnimation.tear }} d="M17.5 11.5C17.5 12.328 16.828 13 16 13s-1.5-.672 1.5-1.5c0-.398.158-.755.41-1.031" fill={hasLaughed ? '#3498DB' : 'none'} stroke="none" opacity="0"/>
                                </motion.svg>
                            </motion.div>
                             {post.laughs && post.laughs.length > 0 && (
                                <span className="font-semibold text-sm ml-1">{post.laughs.length}</span>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center justify-end gap-x-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsShareDialogOpen(true)} disabled={!currentUser}>
                            <Share2 className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Star className="h-6 w-6" />
                        </Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-6 w-6" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-4">
                                        <div>
                                        {isAuthor 
                                            ? "This action cannot be undone. This will permanently delete this post." 
                                            : "This action will make this post private, so only the author can see it."}
                                        </div>
                                        {defenceCreditValue > 0 && !isAuthor && (
                                            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-md">
                                                <div className="text-sm text-yellow-900 dark:text-yellow-200 flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    This post has a Defence Credit of <span className="font-bold">{defenceCreditValue}</span>.
                                                </div>
                                            </div>
                                        )}
                                        {!isAuthor && (
                                            <div className="space-y-2">
                                                <Label htmlFor="offence-credit">Offence Credit</Label>
                                                <Input 
                                                    id="offence-credit"
                                                    type="number"
                                                    placeholder={`Enter more than ${defenceCreditValue}`}
                                                    value={offenceCredit}
                                                    onChange={(e) => setOffenceCredit(e.target.value)}
                                                />
                                                {!hasEnoughOffenceCredits && offenceCreditValue > 0 && (
                                                    <p className="text-xs text-destructive flex items-center justify-start gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        You don't have enough credits.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={isAuthor ? handleDeleteClick : handleMakePrivateClick}
                                    disabled={!isAuthor && (!isOffenceCreditSufficient || !hasEnoughOffenceCredits)}
                                >
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="overflow-hidden"
                        >
                            <div className="w-full mt-4 space-y-4">
                               {post.comments && post.comments.length > 0 && (
                                    <div className="space-y-4">
                                        {post.comments.map((comment) => (
                                            <CommentItem key={comment.id} comment={comment} />
                                        ))}
                                    </div>
                                )}
                               {currentUser && (
                                    <div className="flex items-start gap-2">
                                        <Avatar className="w-8 h-8 mt-2">
                                            <AvatarImage src={currentUser?.photoURL ?? undefined} />
                                            <AvatarFallback>{currentUserInitial}</AvatarFallback>
                                        </Avatar>
                                        <Textarea 
                                            placeholder="Comment here..." 
                                            className="flex-1"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            disabled={isCommenting}
                                        />
                                        <Button 
                                            className="self-end" 
                                            onClick={handleCommentPost} 
                                            disabled={isCommenting || !commentText.trim()}
                                        >
                                            {isCommenting ? "Posting..." : "Post"}
                                        </Button>
                                    </div>
                               )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="flex flex-col items-center justify-center pt-3 mt-3">
                    <Button 
                      variant="outline"
                      className="w-full text-base bg-white text-black hover:bg-neutral-100 border-black"
                      onClick={handleCommentClick}
                      disabled={!currentUser}
                    >
                        <span className="font-semibold">Comment</span>
                         {post.comments && post.comments.length > 0 && (
                            <span className="ml-2 font-semibold">{post.comments.length}</span>
                        )}
                    </Button>
                </div>
            </div>
            <SharePostDialog 
                isOpen={isShareDialogOpen} 
                onOpenChange={setIsShareDialogOpen}
                postToShare={post.type === 'share' && post.sharedPost ? post.sharedPost : post}
                currentUser={currentUser}
                onSharePost={onSharePost}
            />
        </>
    );
}


interface PostFeedProps {
  posts: Post[];
  currentUser?: User | null;
  onDeletePost: (postId: string, mediaUrl?: string) => void;
  onMakePostPrivate: (post: Post, offenceCredit: number) => void;
  onMakePostPublic: (postId: string, newDefenceCredit: number) => void;
  onReact: (postId: string, authorId: string, reaction: 'like' | 'laugh') => void;
  onCommentPost: (postId: string, commentText: string) => Promise<void>;
  onSharePost: (
    content: string,
    contentBangla: string,
    file: File | null,
    fileBangla: File | null,
    defenceCredit: number,
    localColor: string,
    postType: 'original' | 'share',
    sharedPostId: string
  ) => Promise<void>;
}

export function PostFeed({ posts, currentUser, onDeletePost, onMakePostPrivate, onMakePostPublic, onReact, onCommentPost, onSharePost }: PostFeedProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-semibold font-headline">No tales yet!</h3>
        <p className="text-sm">This user hasn't posted anything yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div 
            key={post.id}
            id={post.id}
            className="flex items-center justify-center min-h-screen scroll-snap-start"
          >
            <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full"
            >
                <PostCard 
                post={post} 
                currentUser={currentUser} 
                onDelete={onDeletePost}
                onMakePostPrivate={onMakePostPrivate}
                onMakePostPublic={onMakePostPublic}
                onReact={onReact} 
                onComment={onCommentPost}
                onSharePost={onSharePost}
                />
            </motion.div>
        </div>
      ))}
    </div>
  );
}
