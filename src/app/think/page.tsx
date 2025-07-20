
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Video, CheckCircle, Loader2, User as UserIcon, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import type { ThinkCourse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ThinkPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
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
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const maxParticipants = 100;

  const checkRegistrationStatus = useCallback(async () => {
    if (!db) return;

    let checkEmail = user?.email;
    if (!checkEmail && typeof window !== 'undefined') {
        checkEmail = localStorage.getItem('thinkCourseEmail');
    }

    if (checkEmail) {
        try {
            const q = query(collection(db, "think_free_class_registrations"), where("email", "==", checkEmail));
            const querySnapshot = await getDocs(q);
            setIsRegistered(!querySnapshot.empty);
        } catch (error) {
            console.error("Failed to check registration", error);
            setIsRegistered(false);
        }
    } else {
        setIsRegistered(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
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
    
    const registrationsColRef = collection(db, 'think_free_class_registrations');
    const unsubscribeRegistrations = onSnapshot(registrationsColRef, (snapshot) => {
      setRegistrations(snapshot.size);
    }, (error) => {
        console.error("Error fetching registrations count:", error);
    });
    
    checkRegistrationStatus().finally(() => setIsLoading(false));

    return () => {
      unsubscribeCourse();
      unsubscribeRegistrations();
    };
  }, [authLoading, checkRegistrationStatus]);

  const handleRegister = async () => {
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    if (!name.trim() || !email.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter your name and email.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (registrations >= maxParticipants && !isRegistered) {
        toast({ variant: 'destructive', title: 'Registration Full', description: 'The course has reached its maximum number of participants.' });
        setIsSubmitting(false);
        return;
      }
      
      const registrationsCollection = collection(db, 'think_free_class_registrations');
      const q = query(registrationsCollection, where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({ title: 'Already Registered', description: 'This email address is already registered.' });
        setIsRegistered(true);
        if (typeof window !== 'undefined' && !user) {
            localStorage.setItem('thinkCourseEmail', email.trim());
        }
        setIsSubmitting(false);
        return;
      }

      await addDoc(registrationsCollection, {
        email: email.trim(),
        name: name.trim(),
        registeredAt: new Date(),
        userId: user?.uid || null, // Store user ID if they are logged in
      });
      
      toast({ title: 'Registration Successful!', description: "You've confirmed your free spot. We'll be in touch!" });
      setIsRegistered(true);
       if (typeof window !== 'undefined' && !user) {
          localStorage.setItem('thinkCourseEmail', email.trim());
      }

    } catch (error: any) {
      console.error("Error registering:", error);
      let description = "An unexpected error occurred. You may need to update your Firestore security rules to allow writes to the 'think_free_class_registrations' collection.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Please check your Firestore security rules.";
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
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
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
            <CardFooter className="p-8 pt-4 flex-col gap-4">
               {isRegistered ? (
                 <div className="w-full text-center p-4 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                    <p className="font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" /> You are registered!
                    </p>
                 </div>
               ) : (
                <div className="w-full space-y-4">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="name">Your Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
                      </div>
                    </div>
                     <div className="space-y-2 text-left">
                      <Label htmlFor="email">Email Address</Label>
                       <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                       </div>
                    </div>
                     <Button 
                        className="w-full h-12 text-lg mt-4" 
                        onClick={handleRegister} 
                        disabled={isRegistered || isSubmitting || (registrations >= maxParticipants && !isRegistered)}
                    >
                        {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isRegistered ? (
                        <>
                            <CheckCircle className="mr-2 h-5 w-5" /> You're All Set!
                        </>
                        ) : registrations >= maxParticipants ? (
                        'Class is Full'
                        ) : (
                        'Confirm Your Free Spot'
                        )}
                    </Button>
                </div>
               )}

            </CardFooter>
          </Card>
        </main>
      </div>
  );
}
