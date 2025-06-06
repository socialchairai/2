import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import InviteMemberForm from "./InviteMemberForm";

export default function ChapterInvitesPage() {
  const { user, chapter, role } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<ChapterInviteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageInvites =
    role?.name === "Social Chair" || role?.name === "Admin";

  const fetchInvites = async () => {
    if (!chapter) return;

    try {
      const { data, error } = await supabase
        .from("chapter_invites")
        .select(
          `
          *,
          inviter:users!chapter_invites_invited_by_fkey(
            first_name,
            last_name,
            email
          )
        `,
        )
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast({
        title: "Error",
        description: "Failed to load invites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("chapter_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Invite deleted",
        description: "The invitation has been removed.",
      });

      fetchInvites();
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast({
        title: "Error",
        description: "Failed to delete invite",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchInvites();
  }, [chapter]);

  if (!canManageInvites) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Chapter Invites</CardTitle>
              <CardDescription>
                Only Social Chairs and Admins can manage invites.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chapter Invites
            </h1>
            <p className="text-gray-600 mt-2">
              Manage invitations for {chapter?.fraternity_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InviteMemberForm onInviteSent={fetchInvites} />

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Recent Invites</CardTitle>
              <CardDescription>
                Track the status of sent invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : invites.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No invites sent yet
                </p>
              ) : (
                <div className="space-y-3">
                  {invites.slice(0, 5).map((invite) => {
                    const expired = isExpired(invite.expires_at);
                    const actualStatus =
                      expired && invite.status === "pending"
                        ? "expired"
                        : invite.status;

                    return (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {invite.invited_email}
                            </span>
                            <Badge
                              variant="outline"
                              className={getStatusColor(actualStatus)}
                            >
                              {getStatusIcon(actualStatus)}
                              <span className="ml-1 capitalize">
                                {actualStatus}
                              </span>
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            Role: {invite.role} • Sent{" "}
                            {format(new Date(invite.created_at), "MMM d, yyyy")}
                          </div>
                          {invite.status === "pending" && (
                            <div className="text-xs text-gray-400">
                              Expires{" "}
                              {format(
                                new Date(invite.expires_at),
                                "MMM d, yyyy",
                              )}
                            </div>
                          )}
                        </div>
                        {(invite.status === "pending" || expired) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInvite(invite.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {invites.length > 5 && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>All Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invites.slice(5).map((invite) => {
                  const expired = isExpired(invite.expires_at);
                  const actualStatus =
                    expired && invite.status === "pending"
                      ? "expired"
                      : invite.status;

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {invite.invited_email}
                          </span>
                          <Badge
                            variant="outline"
                            className={getStatusColor(actualStatus)}
                          >
                            {getStatusIcon(actualStatus)}
                            <span className="ml-1 capitalize">
                              {actualStatus}
                            </span>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Role: {invite.role} • Sent{" "}
                          {format(new Date(invite.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                      {(invite.status === "pending" || expired) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvite(invite.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
