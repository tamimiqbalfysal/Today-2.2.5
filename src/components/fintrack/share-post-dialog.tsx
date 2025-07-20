
'use client';

import { useState } from 'react';
import type { Post, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface SharePostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postToShare?: Post;
  currentUser: User | null;
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

export function SharePostDialog({
  isOpen,
  onOpenChange,
  postToShare,
  currentUser,
  onSharePost,
}: SharePostDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser || !postToShare) return;

    setIsSubmitting(true);
    try {
      await onSharePost(content, '', null, null, 0, '', 'share', postToShare.id);
      setContent('');
      onOpenChange(false);
    } catch (error) {
      // Parent handles toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser || !postToShare) {
    return null;
  }
  
  const authorInitial = postToShare.authorName ? postToShare.authorName.charAt(0) : 'U';
  const timestamp = postToShare.timestamp?.toDate ? postToShare.timestamp.toDate() : new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <Textarea
              placeholder={`What's on your mind, ${currentUser.name}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={postToShare.authorPhotoURL} alt={postToShare.authorName} />
                        <AvatarFallback>{authorInitial}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{postToShare.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(timestamp, { addSuffix: true })}
                        </p>
                    </div>
                </div>
                {postToShare.content && (
                    <p className="text-sm text-card-foreground mb-3 line-clamp-3">
                        {postToShare.content}
                    </p>
                )}
                {postToShare.mediaURL && postToShare.mediaType === 'image' && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden">
                        <Image src={postToShare.mediaURL} alt="Shared post media" layout="fill" objectFit="cover" />
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
