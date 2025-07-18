import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  id?: string; // Add id for profile page fetching
  name: string;
  username?: string;
  email: string;
  photoURL?: string | null;
  redeemedGiftCodes?: number;
  redeemedThinkCodes?: number;
  paymentCategory?: string;
  paymentAccountName?: string;
  paymentAccountNumber?: string;
  paymentNotes?: string;
  country?: string;
  credits?: number;
  notifications?: Notification[];
  unreadNotifications?: boolean;
  followers?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  timestamp: Timestamp;
  likes: string[]; // Array of user UIDs
  comments: Comment[];
  mediaURL?: string;
  mediaType?: 'image' | 'video';
  type: 'original' | 'share';
  sharedPostId?: string;
  sharedPost?: Post; // For client-side rendering
}

export interface Comment {
    id: string;
    authorId: string;
    authorName:string;
    authorPhotoURL: string;
    content: string;
    timestamp: Timestamp;
}

export interface Notification {
  id: string;
  type: 'like';
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  postId: string;
  timestamp: Timestamp;
  read: boolean;
}
