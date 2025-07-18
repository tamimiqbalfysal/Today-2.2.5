'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Terminal, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured } from '@/lib/firebase';
import { countries } from '@/lib/countries';

const signupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(20, { message: 'Username must be no more than 20 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  country: z.string({ required_error: 'Please select a country.' }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

function FirebaseConfigurationWarning() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50 dark:bg-yellow-950">
      <Card className="w-full max-w-lg m-4 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle /> Action Required: Configure Firebase
          </CardTitle>
          <CardDescription>
            Your app is not connected to Firebase. Please follow these steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To use authentication and other Firebase features, you need to provide your project's configuration.</p>
          <div className="p-4 rounded-md bg-muted">
            <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Firebase Console</a>.</li>
                <li>Select your project, then click the gear icon for <strong>Project settings</strong>.</li>
                <li>In the "Your apps" card, select the "Web" platform (<code>&lt;/&gt;</code>).</li>
                <li>Copy the configuration variables (apiKey, authDomain, etc.) into your <strong>.env</strong> file.</li>
                <li>Restart your development server.</li>
            </ol>
          </div>
           <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Example .env file</AlertTitle>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap mt-2 bg-secondary p-2 rounded">
                    {`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...`}
                </pre>
              </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [showFirebaseWarning, setShowFirebaseWarning] = useState(false);

  useEffect(() => {
    setShowFirebaseWarning(process.env.NODE_ENV === 'development' && !isFirebaseConfigured);
  }, []);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    try {
      await signup(data.name, data.username, data.email, data.password, data.country);
    } catch (error: any) {
      const errorCode = error.code;
      let description = 'An unexpected error occurred. Please try again.';

      switch (errorCode) {
        case 'auth/username-already-in-use':
          description = 'This username is already taken. Please choose another one.';
          break;
        case 'auth/email-already-in-use':
          description = 'This email is already in use by another account.';
          break;
        case 'auth/weak-password':
          description = 'Password is too weak. Please choose a stronger one.';
          break;
        case 'auth/network-request-failed':
          description = 'Could not connect to Firebase. Please check your network connection and ensure your .env configuration is correct.';
          break;
        case 'auth/firestore-setup-failed':
          description = 'Your account was created, but we failed to save your profile. Please check your Firestore security rules to allow writes to the "users" and "usernames" collections.';
          break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
    }
  }

  if (showFirebaseWarning) {
    return <FirebaseConfigurationWarning />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center text-primary">Join the Adventure!</CardTitle>
          <CardDescription className="text-center">
            Create an account to begin your story.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Elara the Brave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="elara_the_brave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Forging Account..." : "Create account"}
                </Button>
              </form>
            </Form>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
