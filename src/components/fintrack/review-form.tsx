
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, collection, runTransaction, Timestamp } from 'firebase/firestore';
import type { Review } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Star, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: (review: Review) => void;
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!currentUser) {
        toast({
            variant: "destructive",
            title: "Please Log In",
            description: "You must be logged in to submit a review.",
            action: (
                <Button onClick={() => router.push('/login')}>Log In</Button>
            ),
        });
        return;
    }

    if (!productId || rating === 0 || !reviewComment.trim()) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please provide a rating and a comment for your review."
        });
        return;
    }
    setIsSubmittingReview(true);
    try {
        const productRef = doc(db, 'posts', productId);
        const newReviewRef = doc(collection(db, 'posts', productId, 'reviews'));

        const newReview: Review = {
            id: newReviewRef.id,
            authorId: currentUser.uid,
            authorName: currentUser.name,
            authorPhotoURL: currentUser.photoURL || '',
            rating: rating,
            comment: reviewComment,
            timestamp: Timestamp.now()
        };

        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) throw "Product does not exist!";
            
            transaction.set(newReviewRef, newReview);

            const currentReviewCount = productDoc.data().reviewCount || 0;
            const currentAverageRating = productDoc.data().averageRating || 0;
            const newReviewCount = currentReviewCount + 1;
            const newAverageRating = ((currentAverageRating * currentReviewCount) + rating) / newReviewCount;
            
            transaction.update(productRef, {
                reviewCount: newReviewCount,
                averageRating: newAverageRating
            });
        });
        
        toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
        
        if (onReviewSubmitted) {
            onReviewSubmitted(newReview);
        }

        setRating(0);
        setReviewComment('');
    } catch (error: any) {
        console.error("Error submitting review:", error);
        let description = "Could not submit your review.";
        if (error.code === 'permission-denied') {
            description = "Permission Denied. Please check your Firestore security rules. You need to allow 'create' on 'posts/{postId}/reviews' and 'update' on the 'posts' collection for authenticated users.";
        }
        toast({ 
            variant: "destructive", 
            title: "Review Error", 
            description: description,
            duration: 10000,
        });
    } finally {
        setIsSubmittingReview(false);
    }
  };

  return (
    <Card>
      <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>Share your thoughts on this product with the community.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Your Rating:</p>
              <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                      <Star
                          key={i}
                          className={cn("h-6 w-6 cursor-pointer", i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")}
                          onClick={() => setRating(i + 1)}
                      />
                  ))}
              </div>
          </div>
          <Textarea
              placeholder="Tell us what you liked or disliked..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              disabled={isSubmittingReview}
          />
          <Button onClick={handleSubmitReview} disabled={isSubmittingReview || rating === 0 || !reviewComment.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
          </Button>
      </CardContent>
    </Card>
  );
}
