
"use client"

import { useState, useRef } from "react";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Video, X, Languages, Shield, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CreatePostFormProps {
  user: User;
  onAddPost: (content: string, contentBangla: string, file: File | null, fileBangla: File | null, defenceCredit: number) => Promise<void>;
}

export function CreatePostForm({ user, onAddPost }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [contentBangla, setContentBangla] = useState("");
  const [defenceCredit, setDefenceCredit] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileBangla, setFileBangla] = useState<File | null>(null);
  const [filePreviewBangla, setFilePreviewBangla] = useState<string | null>(null);
  const [fileTypeBangla, setFileTypeBangla] = useState<'image' | 'video' | null>(null);
  const fileInputBanglaRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, lang: 'en' | 'bn') => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      const isVideo = selectedFile.type.startsWith('video/');

      if (lang === 'en') {
        setFile(selectedFile);
        setFilePreview(URL.createObjectURL(selectedFile));
        setFileType(isImage ? 'image' : isVideo ? 'video' : null);
      } else {
        setFileBangla(selectedFile);
        setFilePreviewBangla(URL.createObjectURL(selectedFile));
        setFileTypeBangla(isImage ? 'image' : isVideo ? 'video' : null);
      }

      if (!isImage && !isVideo) {
        handleRemoveFile(lang);
      }
    }
  };

  const handleRemoveFile = (lang: 'en' | 'bn') => {
    if (lang === 'en') {
      setFile(null);
      setFilePreview(null);
      setFileType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFileBangla(null);
      setFilePreviewBangla(null);
      setFileTypeBangla(null);
      if (fileInputBanglaRef.current) fileInputBanglaRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    setIsSubmitting(true);
    const creditAmount = parseInt(defenceCredit, 10) || 0;
    try {
      await onAddPost(content, contentBangla, file, fileBangla, creditAmount);
      setContent("");
      setContentBangla("");
      setDefenceCredit("");
      handleRemoveFile('en');
      handleRemoveFile('bn');
    } catch (error) {
      // Parent component handles toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user.name ? user.name.charAt(0) : "🥳";
  
  const hasEnglishContent = content.trim() !== '' || file !== null;
  const defenceCreditValue = parseInt(defenceCredit, 10) || 0;
  const hasEnoughCredits = (user.credits || 0) >= defenceCreditValue;

  const isPostButtonDisabled = isSubmitting || !hasEnglishContent || !hasEnoughCredits;

  return (
    <>
    <CardHeader className="flex-row items-start justify-between">
      <div>
        <CardTitle className="font-headline">Share a New Tale</CardTitle>
        <CardDescription>What magical things are happening today?</CardDescription>
      </div>
       <div className="space-y-1 text-right">
        <Label htmlFor="defence-credit" className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Defence Credit
        </Label>
        <Input 
          id="defence-credit"
          type="number"
          placeholder="0"
          className="w-24 h-8 text-right"
          value={defenceCredit}
          onChange={(e) => setDefenceCredit(e.target.value)}
          disabled={isSubmitting}
        />
        {!hasEnoughCredits && (
           <p className="text-xs text-destructive flex items-center justify-end gap-1">
            <AlertTriangle className="h-3 w-3" />
            Not enough credits
          </p>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-10 h-10 border-2 border-primary/50">
            <AvatarImage src={user.photoURL ?? `https://placehold.co/40x40/FF69B4/FFFFFF?text=${userInitial}`} alt={user.name ?? ""} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            {/* English Post Area */}
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Languages className="h-4 w-4" /> English Content
              </label>
              <Textarea
                placeholder={`What's happening, ${user.name}?`}
                className="flex-1 p-3 rounded-lg bg-secondary border-border focus:outline-none focus:ring-2 focus:ring-primary text-secondary-foreground placeholder:text-muted-foreground text-sm min-h-[6rem]"
                value={content}
                onChange={(e) => setContent(e.target.value.replace(/[^a-zA-Z0-9\s.,!?'"()\-&%$#@*+=\[\]{}:;<>|/\\~`^]/g, ''))}
                disabled={isSubmitting}
              />
              {filePreview && (
                <div className="relative mt-2 w-full max-h-96 rounded-lg border overflow-hidden">
                  {fileType === 'image' && <Image src={filePreview} alt="Preview" width={500} height={500} className="w-full h-auto object-contain" />}
                  {fileType === 'video' && <video src={filePreview} controls className="w-full h-auto" />}
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => handleRemoveFile('en')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                  <ImageIcon className="text-green-500 mr-2 h-4 w-4" /> Image
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                  <Video className="text-red-500 mr-2 h-4 w-4" /> Video
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'en')} disabled={isSubmitting} />
              </div>
            </div>

            <Separator />

            {/* Bangla Post Area */}
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Languages className="h-4 w-4" /> Bangla Content
              </label>
              <Textarea
                placeholder={`বাংলায় কী ঘটছে?`}
                className="flex-1 p-3 rounded-lg bg-secondary border-border focus:outline-none focus:ring-2 focus:ring-primary text-secondary-foreground placeholder:text-muted-foreground text-sm min-h-[6rem]"
                value={contentBangla}
                onChange={(e) => setContentBangla(e.target.value)}
                disabled={isSubmitting}
              />
              {filePreviewBangla && (
                <div className="relative mt-2 w-full max-h-96 rounded-lg border overflow-hidden">
                  {fileTypeBangla === 'image' && <Image src={filePreviewBangla} alt="Preview" width={500} height={500} className="w-full h-auto object-contain" />}
                  {fileTypeBangla === 'video' && <video src={filePreviewBangla} controls className="w-full h-auto" />}
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => handleRemoveFile('bn')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputBanglaRef.current?.click()} disabled={isSubmitting}>
                  <ImageIcon className="text-green-500 mr-2 h-4 w-4" /> Image
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputBanglaRef.current?.click()} disabled={isSubmitting}>
                  <Video className="text-red-500 mr-2 h-4 w-4" /> Video
                </Button>
                <input type="file" ref={fileInputBanglaRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'bn')} disabled={isSubmitting} />
              </div>
            </div>
          </div>
        </div>
          
        <div className="flex justify-end items-center">
          <Button type="submit" disabled={isPostButtonDisabled}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </CardContent>
    </>
  );
}
