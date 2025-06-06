import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Mail, UserPlus } from "lucide-react";

interface InviteMemberFormProps {
  onInviteSent?: () => void;
}

export default function InviteMemberForm({
  onInviteSent,
}: InviteMemberFormProps = {}) {
  const { user, chapter, role } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "member" | "officer" | "social_chair"
  >("member");
  const [loading, setLoading] = useState(false);

  // Check if user can send invites
  const canSendInvites =
    role?.name === "Social Chair" || role?.name === "Admin";

  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chapter || !canSendInvites) return;

    setLoading(true);
    try {
      // Check if email is already invited or is a member
      const { data: existingInvite } = await supabase
        .from("chapter_invites")
        .select("*")
        .eq("chapter_id", chapter.id)
        .eq("invited_email", email)
        .eq("status", "pending")
        .single();

      if (existingInvite) {
        toast({
          title: "Invite already exists",
          description: "This email already has a pending invite.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a member
      const { data: existingUser } = await supabase
        .from("users")
        .select(
          `
          id,
          user_chapter_links!inner(
            chapter_id,
            is_active
          )
        `,
        )
        .eq("email", email)
        .eq("user_chapter_links.chapter_id", chapter.id)
        .eq("user_chapter_links.is_active", true)
        .single();

      if (existingUser) {
        toast({
          title: "User already a member",
          description: "This user is already a member of your chapter.",
          variant: "destructive",
        });
        return;
      }

      // Create invite
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error } = await supabase.from("chapter_invites").insert({
        chapter_id: chapter.id,
        invited_email: email,
        role: inviteRole,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Invite sent!",
        description: `Invitation sent to ${email}`,
      });

      setEmail("");
      setInviteRole("member");
      onInviteSent?.();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Error",
        description: "Failed to send invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canSendInvites) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Members
          </CardTitle>
          <CardDescription>
            Only Social Chairs and Admins can send invites.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite New Member
        </CardTitle>
        <CardDescription>
          Send an invitation to join {chapter?.fraternity_name} at{" "}
          {chapter?.school_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={inviteRole}
              onValueChange={(value: "member" | "officer" | "social_chair") =>
                setInviteRole(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="officer">Officer</SelectItem>
                {role?.name === "Admin" && (
                  <SelectItem value="social_chair">Social Chair</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading || !email} className="w-full">
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
