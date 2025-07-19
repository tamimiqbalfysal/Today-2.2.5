'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import type { Notification } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Heart, EyeOff, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function NotificationSheet({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user && user.notifications?.some(n => !n.read)) {
      const markNotificationsAsRead = async () => {
        if (!db || !user?.uid) return;
        
        const batch = writeBatch(db);
        const unreadNotifications = user.notifications?.filter(n => !n.read) || [];
        
        unreadNotifications.forEach(notification => {
          const notificationRef = doc(db, `users/${user.uid}/notifications`, notification.id);
          batch.update(notificationRef, { read: true });
        });
        
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { unreadNotifications: false });
        
        try {
          await batch.commit();
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };

      markNotificationsAsRead();
    }
  }, [isOpen, user]);

  const handleNotificationClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Recent activity from your friends.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6">
            <div className="px-6">
                {user?.notifications && user.notifications.length > 0 ? (
                <div className="space-y-4">
                    {user.notifications.map((notification) => (
                    <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onNotificationClick={handleNotificationClick}
                    />
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <p className="text-lg font-semibold">No notifications yet</p>
                    <p>When someone interacts with you, it will show up here.</p>
                </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationItem({ notification, onNotificationClick }: { notification: Notification; onNotificationClick: () => void; }) {
    const timestamp = notification.timestamp?.toDate ? notification.timestamp.toDate() : new Date();
    
    let icon;
    let text;

    switch (notification.type) {
        case 'like':
            icon = <Heart className="h-4 w-4 text-red-500" />;
            text = <><span className="font-semibold">{notification.senderName}</span> liked your post.</>;
            break;
        case 'postMadePrivate':
            icon = <EyeOff className="h-4 w-4 text-orange-500" />;
            text = <><span className="font-semibold">{notification.senderName}</span> made your post private.</>;
            break;
        case 'postDeleted':
             icon = <Trash2 className="h-4 w-4 text-destructive" />;
             text = <><span className="font-semibold">{notification.senderName}</span> deleted your post.</>;
             break;
        default:
            return null;
    }

    return (
        <Link href={`/#${notification.postId}`} onClick={onNotificationClick} className="block">
            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent">
                <div className="relative">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.senderPhotoURL} />
                        <AvatarFallback>{notification.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        {icon}
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-sm">
                        {text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                    </p>
                </div>
            </div>
        </Link>
    );
}
