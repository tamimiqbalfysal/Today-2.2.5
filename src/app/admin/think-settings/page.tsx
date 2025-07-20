
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Link as LinkIcon, Save, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ThinkCourse } from '@/lib/types';
import Link from 'next/link';

export default function ThinkSettingsPage() {
  const { toast } = useToast();
  const [courseDate, setCourseDate] = useState<Date | undefined>();
  const [meetLink, setMeetLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCourseSettings = async () => {
      if (!db) return;
      setIsLoading(true);
      try {
        const courseDocRef = doc(db, 'courseAdmin', 'think');
        const docSnap = await getDoc(courseDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ThinkCourse;
          if (data.date) {
            setCourseDate(data.date.toDate());
          }
          setMeetLink(data.meetLink || '');
        }
      } catch (error) {
        console.error('Error fetching course settings:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load course settings.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseSettings();
  }, [toast]);
  
  const handleSaveChanges = async () => {
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firebase not configured.' });
        return;
    }
    setIsSaving(true);
    try {
        const courseDocRef = doc(db, 'courseAdmin', 'think');
        const courseData: Partial<ThinkCourse> = {};
        
        if (courseDate) {
            courseData.date = Timestamp.fromDate(courseDate);
        }
        if (meetLink) {
            courseData.meetLink = meetLink;
        }

        await setDoc(courseDocRef, courseData, { merge: true });
        
        toast({ title: 'Success', description: 'Course settings saved successfully.' });

    } catch (error: any) {
        console.error("Error saving settings:", error);
        let description = "An unexpected error occurred.";
        if (error.code === 'permission-denied') {
            description = "Permission denied. Check your Firestore security rules to allow writes to the 'courseAdmin' collection.";
        }
        toast({ variant: 'destructive', title: 'Save Failed', description });
    } finally {
        setIsSaving(false);
    }
  };

  return (
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-2xl p-4 flex flex-col items-center justify-center">
            {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Manage "Think" Course</CardTitle>
                        <CardDescription>
                        Set the official date and Google Meet link for the course. This will be visible to all registered participants.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="course-date">Course Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !courseDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {courseDate ? format(courseDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={courseDate}
                                    onSelect={setCourseDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meet-link">Google Meet Link</Label>
                             <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="meet-link"
                                    type="url"
                                    placeholder="https://meet.google.com/..."
                                    value={meetLink}
                                    onChange={(e) => setMeetLink(e.target.value)}
                                    className="pl-9"
                                />
                             </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button asChild variant="outline">
                                <Link href="/admin">Back to Admin</Link>
                            </Button>
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
          </div>
        </main>
      </div>
  );
}
