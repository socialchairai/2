import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ChapterInviteWithDetails } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Clock, UserPlus } from "lucide-react";
import { format } from "date-fns";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [invite, setInvite] = useState<ChapterInviteWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  const fetchInvite = async () => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chapter_invites")
        .select(
          `
          *,
          chapter:chapters(*),
          inviter:users!chapter_invites_invited_by_fkey(
            first_name,
            last_name,
            email
          )
        `,
        )
        .eq("token", token)
        .single();

      if (error) {
        setError("Invitation not found");
        return;
      }

      // Check if invite is expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        return;
      }

      // Check if invite is already accepted
      if (data.status === "accepted") {
        setError("This invitation has already been accepted");
        return;
      }

      // Check if user email matches invite email
      if (user && user.email !== data.invited_email) {
        setError("This invitation is for a different email address");
        return;
      }

      setInvite(data);
    } catch (error) {
      console.error("Error fetching invite:", error);
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!invite || !user) return;

    setAccepting(true);
    try {
      // Check if user is already a member of this chapter
      const { data: existingLink } = await supabase
        .from("user_chapter_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("chapter_id", invite.chapter_id)
        .eq("is_active", true)
        .single();

      if (existingLink) {
        setError("You are already a member of this chapter");
        return;
      }

      // Get role ID
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq(
          "name",
          invite.role === "social_chair"
            ? "Social Chair"
            : invite.role === "officer"
              ? "Officer"
              : "Member",
        )
        .single();

      if (roleError) {
        throw new Error("Role not found");
      }

      // Create user-chapter link
      const { error: linkError } = await supabase
        .from("user_chapter_links")
        .insert({
          user_id: user.id,
          chapter_id: invite.chapter_id,
          role_id: roleData.id,
          is_primary: true, // Make this their primary chapter if they don't have one
        });

      if (linkError) throw linkError;

      // Update invite status
      const { error: updateError } = await supabase
        .from("chapter_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      toast({
        title: "Welcome to the chapter!",
        description: `You've successfully joined ${invite.chapter?.fraternity_name}`,
      });

      // Refresh user data to get new chapter info
      await refreshUserData();

      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    fetchInvite();
  }, [token, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to accept this chapter invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Chapter Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a chapter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite && (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  {invite.chapter?.fraternity_name}
                </h3>
                <p className="text-gray-600">{invite.chapter?.school_name}</p>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Role: {invite.role}
                </Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Invited by:</span>
                  <span className="font-medium">
                    {invite.inviter?.first_name} {invite.inviter?.last_name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium">
                    {format(new Date(invite.expires_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={acceptInvite}
                  disabled={accepting}
                  className="flex-1"
                >
                  {accepting ? "Accepting..." : "Accept Invitation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
