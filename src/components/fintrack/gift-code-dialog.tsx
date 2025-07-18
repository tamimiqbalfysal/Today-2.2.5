'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ThinkCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
}

export function ThinkCodeDialog({ open, onOpenChange, userId }: ThinkCodeDialogProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Please enter a Think Code.',
      });
      return;
    }

    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase is not configured correctly.',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const thinkCodeRef = doc(db, 'thinkCodes', code.trim());
      const docSnap = await getDoc(thinkCodeRef);

      if (!docSnap.exists() || docSnap.data()?.isUsed === true) {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: 'This Think Code is invalid or has already been used.',
        });
        setIsVerifying(false);
        return;
      }
      
      await updateDoc(thinkCodeRef, { isUsed: true });

      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { redeemedThinkCodes: increment(1) });
      }

      toast({
        title: 'Success!',
        description: 'Think Code submitted successfully!',
      });
      
      onOpenChange(false);
      setCode('');
      router.push('/thank-you');

    } catch (error: any)
      {
      console.error("Error verifying Think Code:", error);
      let description = "An unexpected error occurred.";
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        description = "Permission Denied. Your security rules must allow 'update' on both the 'thinkCodes' and 'users' collections for this to work. Please check your Firestore rules in the Firebase Console.";
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: description,
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleCloseDialog = () => {
    if (!isVerifying) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Your Think Code</DialogTitle>
          <DialogDescription>
            Have a special Think Code? Enter it below.
          </DialogDescription>
        </DialogHeader>
        <form id="think-code-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Input
            id="code"
            placeholder="Enter your Think Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isVerifying}
            aria-label="Think Code"
          />
        </form>
        <DialogFooter>
          <Button type="submit" form="think-code-form" disabled={isVerifying || !code.trim()}>
            {isVerifying ? 'Verifying...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
