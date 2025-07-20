
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Menu, PenSquare, Trash2, User, LogOut, Home, PlusCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/auth-context';
import { cn } from "@/lib/utils";
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
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDrawer } from "@/contexts/drawer-context";
import Image from "next/image";
import { useCart } from "@/contexts/cart-context";

const hoverIndicator = <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-foreground scale-y-0 group-hover:scale-y-100 transition-transform origin-center rounded-r-full" />;

interface HeaderProps {
  isVisible?: boolean;
}

export function Header({ isVisible = true }: HeaderProps) {
  const { user, logout, deleteAccount } = useAuth();
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { drawerApps, removeLastAppFromDrawer } = useDrawer();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deleteAccount) return;
    try {
      await deleteAccount(password);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      setIsConfirmDeleteOpen(false);
      setIsNavDrawerOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "An unexpected error occurred while deleting your account.",
      });
    } finally {
      setPassword("");
    }
  };

  return (
    <>
      <header className={cn(
        "bg-background/80 backdrop-blur-sm border-b p-4 sticky top-0 z-10 transition-transform duration-300 ease-in-out",
        !isVisible && "-translate-y-full"
      )}>
        <div className="container mx-auto grid grid-cols-3 items-center">
          {user ? (
            <>
              {/* Left: Navigation Drawer */}
              <div className="justify-self-start">
                  <Sheet open={isNavDrawerOpen} onOpenChange={setIsNavDrawerOpen}>
                      <SheetTrigger asChild>
                          <Button size="icon" variant="ghost" className="rounded-full">
                              <Menu />
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="bg-white dark:bg-card w-72 flex flex-col p-0">
                        <SheetHeader className="p-4 border-b border-border items-center">
                          <SheetTitle className="sr-only">User Menu</SheetTitle>
                          <Avatar className="h-16 w-16 border-4 border-primary/50">
                            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ""} />
                            <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">{user.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </SheetHeader>
                        <div className="flex-grow py-4 px-4 space-y-4">
                            <Button asChild size="lg" className="group relative w-full justify-start text-lg font-bold" variant="ghost">
                              <Link href="/profile" onClick={() => setIsNavDrawerOpen(false)}>
                                  {hoverIndicator}
                                  <User className="mr-4" />
                                  Profile
                              </Link>
                            </Button>
                            
                            <Button
                              size="lg"
                              variant="ghost"
                              className="group relative w-full justify-start text-lg font-bold text-destructive hover:text-destructive"
                              onClick={() => setIsConfirmDeleteOpen(true)}
                            >
                              {hoverIndicator}
                              <Trash2 className="mr-4" />
                              Delete
                            </Button>

                        </div>
                        <div className="p-4 border-t border-border">
                           <Button 
                              size="lg" 
                              className="group relative w-full justify-start text-lg font-bold"
                              variant="ghost"
                              onClick={() => {
                                  logout();
                                  setIsNavDrawerOpen(false);
                              }}
                            >
                                {hoverIndicator}
                                <LogOut className="mr-4" />
                                Log Out
                            </Button>
                        </div>
                      </SheetContent>
                  </Sheet>
              </div>
              
              {/* Center: Home */}
               <div className="justify-self-center flex flex-col items-center">
                <Link href="/" aria-label="Home">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Home />
                  </Button>
                </Link>
              </div>

              {/* Right: Another Drawer */}
              <div className="justify-self-end flex items-center gap-2">
                <Sheet open={isProfileDrawerOpen} onOpenChange={setIsProfileDrawerOpen}>
                  <SheetTrigger asChild>
                      <Button size="icon" variant="ghost" className="rounded-full">
                          <Menu />
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white dark:bg-card w-72 flex flex-col p-0">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex-grow py-4 px-4 space-y-4">
                          {drawerApps.map((app) => (
                              <Button asChild size="lg" className="group relative w-full justify-start text-lg font-bold" variant="ghost" key={app.id}>
                                  <Link href={app.href} onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center">
                                      {hoverIndicator}
                                      <Image src={app.logo} alt="" width={20} height={20} className="mr-4" />
                                      {app.name}
                                  </Link>
                              </Button>
                          ))}
                          <Button 
                              size="lg" 
                              variant="ghost"
                              className="group relative w-full justify-start text-lg font-bold"
                              onClick={removeLastAppFromDrawer}
                              disabled={drawerApps.length <= 1}
                          >
                              {hoverIndicator}
                              <Trash2 className="mr-4" />
                              Remove
                          </Button>
                          <Button asChild size="lg" className="group relative w-full justify-start text-lg font-bold" variant="ghost">
                              <Link href="/add" onClick={() => setIsProfileDrawerOpen(false)}>
                                  {hoverIndicator}
                                  <PlusCircle className="mr-4" />
                                  Add
                              </Link>
                          </Button>
                      </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <>
              <div className="justify-self-start">
                  {/* Placeholder to keep layout consistent */}
              </div>
              <div className="justify-self-center flex flex-col items-center">
                <Link href="/" aria-label="Home">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Home />
                  </Button>
                </Link>
              </div>
              <div className="justify-self-end flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </>
          ) }
        </div>
      </header>
      
      {/* Delete Account Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  This action cannot be undone. This will permanently delete your account and remove your data.
                  <ul className="list-disc list-inside my-2">
                    <li>Deleting your account will delete all Gift Codes.</li>
                  </ul>
                  To confirm, please enter your password.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="password-confirm" className="sr-only">
                Password
              </Label>
              <Input
                id="password-confirm"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPassword("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!password}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
