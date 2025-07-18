'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

export interface FeedbackData {
  category: string;
  accountName: string;
  accountNumber: string;
  anythingElse: string;
}

interface FeedbackCardProps {
  user: User | null;
  onSave: (data: FeedbackData) => Promise<void>;
  onDelete: () => Promise<void>;
}


export function FeedbackCard({ user, onSave, onDelete }: FeedbackCardProps) {
  const [category, setCategory] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [anythingElse, setAnythingElse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setCategory(user.paymentCategory || '');
      setAccountName(user.paymentAccountName || '');
      setAccountNumber(user.paymentAccountNumber || '');
      setAnythingElse(user.paymentNotes || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (category && accountName && accountNumber) {
      setIsSubmitting(true);
      await onSave({ category, accountName, accountNumber, anythingElse });
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await onDelete();
    setCategory('');
    setAccountName('');
    setAccountNumber('');
    setAnythingElse('');
    setIsSubmitting(false);
  };

  const hasSubmittedFeedback = user?.paymentCategory && user?.paymentAccountName && user?.paymentAccountNumber;

  return (
    <div className="w-full space-y-6">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>We know you love Gifts! 🎁</CardTitle>
          <CardDescription>Once a gift is disbursed, it will be automatically transferred to the account you specified.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="feedback-category">Account</Label>
              <Select onValueChange={setCategory} value={category} disabled={isSubmitting}>
                <SelectTrigger id="feedback-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bkash">Bkash</SelectItem>
                  <SelectItem value="Cellfin">Cellfin</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Upay">Upay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                type="text"
                placeholder="Enter your account name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                type="text"
                inputMode="numeric"
                placeholder="Enter your account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="anything-else">Anything Else?</Label>
              <Textarea
                id="anything-else"
                placeholder="If there’s anything we ought to know, don’t be shy — drop it our way!"
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!category || !accountName || !accountNumber || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Send My Gift Here'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {hasSubmittedFeedback && (
        <Card className="w-full">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your Submitted Account Information</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isSubmitting}>
              <Trash2 className="h-5 w-5 text-destructive" />
              <span className="sr-only">Delete feedback and add new one</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-left">
            <div>
              <p className="font-semibold text-muted-foreground">Account</p>
              <p>{user.paymentCategory}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Account Name</p>
              <p>{user.paymentAccountName}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Account Number</p>
              <p>{user.paymentAccountNumber}</p>
            </div>
            {user.paymentNotes && (
              <div>
                <p className="font-semibold text-muted-foreground">Anything Else?</p>
                <p>{user.paymentNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
