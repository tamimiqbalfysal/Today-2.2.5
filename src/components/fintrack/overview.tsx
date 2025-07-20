import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types";
import { MapPin, Users, UserPlus, UserMinus } from "lucide-react";
import { Button } from "../ui/button";

interface ProfileCardProps {
  user: User;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

export function ProfileCard({ user, isOwnProfile = false, isFollowing, onFollowToggle }: ProfileCardProps) {
  const followersCount = user.followers?.length ?? 0;

  return (
    <Card className="w-full">
      <CardHeader className="items-center text-center p-6">
        <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50 shadow-lg">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.name ?? "user"} />
            <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">{user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl text-primary font-headline">{user.name}</CardTitle>
        <CardDescription>@{user.username}</CardDescription>
        <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
        {user.country && (
            <CardDescription className="text-muted-foreground flex items-center pt-1">
                <MapPin className="mr-1 h-4 w-4" />
                {user.country}
            </CardDescription>
        )}
      </CardHeader>
      <CardFooter className="flex-col p-4 border-t">
        {isOwnProfile ? (
          <div className="text-center">
            <p className="font-bold text-lg text-foreground">{followersCount}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
        ) : onFollowToggle ? (
            <Button className="w-full" onClick={onFollowToggle} variant={isFollowing ? "outline" : "default"}>
                {isFollowing ? (
                    <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                    </>
                ) : (
                    <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                    </>
                )}
            </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
