
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Video, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, collection } from 'firebase/firestore';
import type { ThinkCourse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function ThinkPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-muted rounded-full animate-pulse"></div>
            </div>
            <CardTitle className="text-4xl font-bold">Think: The Course</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Master your mind. Master your life.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-6 bg-muted rounded-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

export default function ThinkPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<ThinkCourse | null>(null);
  const [registrations, setRegistrations] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxParticipants = 100;

  const checkRegistration = useCallback(async () => {
    if (!user || !db) return;
    const registrationRef = doc(db, 'think_registrations', user.uid);
    const docSnap = await getDoc(registrationRef);
    setIsRegistered(docSnap.exists());
  }, [user]);
  
  useEffect(() => {
    if (authLoading) return;
    setIsLoading(true);

    const courseDocRef = doc(db, 'courseAdmin', 'think');
    const unsubscribeCourse = onSnapshot(courseDocRef, (doc) => {
      if (doc.exists()) {
        setCourse(doc.data() as ThinkCourse);
      }
    }, (error) => {
      console.error("Error fetching course data:", error);
    });

    const registrationsColRef = collection(db, 'think_registrations');
    const unsubscribeRegistrations = onSnapshot(registrationsColRef, (snapshot) => {
      setRegistrations(snapshot.size);
    });
    
    checkRegistration().finally(() => setIsLoading(false));

    return () => {
      unsubscribeCourse();
      unsubscribeRegistrations();
    };
  }, [authLoading, checkRegistration]);

  const handleRegister = async () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'You must be logged in to register.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (registrations >= maxParticipants) {
        toast({ variant: 'destructive', title: 'Registration Full', description: 'The course has reached its maximum number of participants.' });
        return;
      }

      const registrationRef = doc(db, 'think_registrations', user.uid);
      await setDoc(registrationRef, {
        email: user.email,
        name: user.name,
        registeredAt: new Date(),
      });
      
      toast({ title: 'Registration Successful!', description: "You've confirmed your attendance. We'll notify you when the date is announced." });
      setIsRegistered(true);

    } catch (error: any) {
      console.error("Error registering:", error);
      let description = "An unexpected error occurred.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Please check your Firestore security rules to allow writes to the 'think_registrations' collection.";
      }
      toast({ variant: 'destructive', title: 'Registration Failed', description });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || authLoading) {
    return <ThinkPageSkeleton />;
  }
  
  const progress = (registrations / maxParticipants) * 100;

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl rounded-2xl">
            <CardHeader className="text-center p-8">
               <div className="flex justify-center mb-4">
                    <div className="h-20 w-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Users className="h-10 w-10" />
                    </div>
                </div>
              <CardTitle className="text-4xl md:text-5xl font-bold tracking-tighter text-primary">Think: The Course</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2">A free, live online course to help you master your mind.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                   <div className="flex items-center gap-2">
                     <Calendar className="h-5 w-5"/>
                     <span className="font-semibold">{course?.date ? format(course.date.toDate(), 'PPP') : 'To be announced'}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Video className="h-5 w-5"/>
                     <span className="font-semibold">{course?.meetLink ? <a href={course.meetLink} target="_blank" rel="noopener noreferrer" className="underline">Google Meet</a> : 'Link coming soon'}</span>
                   </div>
                </div>
                <p className="text-sm">We'll announce the official date once all spots are filled. Join us!</p>
              </div>

              <div className="space-y-2 pt-4">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between font-medium text-sm">
                    <p>Participants</p>
                    <p className="text-muted-foreground">
                        <span className="text-foreground font-bold">{registrations}</span> / {maxParticipants}
                    </p>
                </div>
              </div>

            </CardContent>
            <CardFooter className="p-8">
               <Button 
                className="w-full h-12 text-lg" 
                onClick={handleRegister} 
                disabled={isRegistered || isSubmitting || registrations >= maxParticipants}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : isRegistered ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" /> You are registered!
                  </>
                ) : registrations >= maxParticipants ? (
                  'Class is Full'
                ) : (
                  'Confirm Your Free Spot'
                )}
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}
