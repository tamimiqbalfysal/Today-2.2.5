
'use client';

import { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Gift, BrainCircuit, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { toast } = useToast();
  const [lastGiftCode, setLastGiftCode] = useState('');
  const [lastThinkCode, setLastThinkCode] = useState('');
  const [isGeneratingGift, setIsGeneratingGift] = useState(false);
  const [isGeneratingThink, setIsGeneratingThink] = useState(false);

  const generateCode = async (type: 'gift' | 'think') => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase not configured.' });
      return;
    }

    const newCode = uuidv4();
    const collectionName = type === 'gift' ? 'giftCodes' : 'thinkCodes';
    const setIsGenerating = type === 'gift' ? setIsGeneratingGift : setIsGeneratingThink;
    const setLastCode = type === 'gift' ? setLastGiftCode : setLastThinkCode;

    setIsGenerating(true);
    try {
      const codeRef = doc(collection(db, collectionName), newCode);
      await setDoc(codeRef, { isUsed: false });
      setLastCode(newCode);
      toast({
        title: 'Code Generated!',
        description: `New ${type} code created successfully.`,
      });
    } catch (error: any) {
      console.error(`Error generating ${type} code:`, error);
      let description = `An unexpected error occurred while generating the ${type} code.`;
      if (error.code === 'permission-denied') {
        description = `Permission Denied. Please check your Firestore security rules to allow writes to the "${collectionName}" collection.`;
      }
      toast({ variant: 'destructive', title: 'Generation Failed', description });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Code copied to clipboard.' });
  };

  return (
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-2xl p-4 flex flex-col items-center justify-center">
            <div className="w-full space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="text-primary" />
                    Generate Gift Code
                  </CardTitle>
                  <CardDescription>
                    Create a new unique code for the "Thank u, G!" page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => generateCode('gift')}
                    disabled={isGeneratingGift}
                    className="w-full"
                  >
                    {isGeneratingGift ? 'Generating...' : 'Generate New Gift Code'}
                  </Button>
                  {lastGiftCode && (
                    <div className="space-y-2">
                      <Label>Last Generated Gift Code:</Label>
                      <div className="flex items-center space-x-2">
                        <Input value={lastGiftCode} readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(lastGiftCode)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="text-primary" />
                    Generate Think Code
                  </CardTitle>
                  <CardDescription>
                    Create a new unique code for the "Think Code" popup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => generateCode('think')}
                    disabled={isGeneratingThink}
                    className="w-full"
                  >
                    {isGeneratingThink ? 'Generating...' : 'Generate New Think Code'}
                  </Button>
                  {lastThinkCode && (
                    <div className="space-y-2">
                      <Label>Last Generated Think Code:</Label>
                      <div className="flex items-center space-x-2">
                        <Input value={lastThinkCode} readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(lastThinkCode)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenCheck className="text-primary" />
                    "Think" Course Settings
                  </CardTitle>
                  <CardDescription>
                    Manage the date and meeting link for the "Think" online course.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/admin/think-settings">
                            Go to Course Settings
                        </Link>
                    </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>
  );
}
