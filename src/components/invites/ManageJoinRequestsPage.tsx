import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ChapterJoinRequestWithDetails } from "@/types/database";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, User, Mail } from "lucide-react";
import { format } from "date-fns";

export default function ManageJoinRequestsPage() {
  const { user, chapter, role } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ChapterJoinRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  const canManageRequests =
    role?.name === "Social Chair" || role?.name === "Admin";

  const fetchRequests = async () => {
    if (!chapter) return;

    try {
      let query = supabase
        .from("chapter_join_requests")
        .select(
          `
          *,
          user:users!chapter_join_requests_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          reviewer:users!chapter_join_requests_reviewed_by_fkey(
            first_name,
            last_name,
            email
          )
        `,
        )
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load join requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "approved" | "rejected",
  ) => {
    if (!user) return;

    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      // If approving, create user-chapter link
      if (action === "approved") {
        // Get default member role
        const { data: roleData, error: roleError } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "Member")
          .single();

        if (roleError) {
          throw new Error("Member role not found");
        }

        // Create user-chapter link
        const { error: linkError } = await supabase
          .from("user_chapter_links")
          .insert({
            user_id: request.user_id,
            chapter_id: request.chapter_id,
            role_id: roleData.id,
            is_primary: false, // Don't make it primary automatically
          });

        if (linkError) throw linkError;
      }

      // Update request status
      const { error } = await supabase
        .from("chapter_join_requests")
        .update({
          status: action,
          reviewed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: action === "approved" ? "Request approved" : "Request rejected",
        description: `Join request has been ${action}`,
      });

      fetchRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action.slice(0, -1)} request`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [chapter, filter]);

  if (!canManageRequests) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Manage Join Requests</CardTitle>
              <CardDescription>
                Only Social Chairs and Admins can manage join requests.
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
            <h1 className="text-3xl font-bold text-gray-900">Join Requests</h1>
            <p className="text-gray-600 mt-2">
              Review membership requests for {chapter?.fraternity_name}
            </p>
          </div>
          <Select
            value={filter}
            onValueChange={(
              value: "all" | "pending" | "approved" | "rejected",
            ) => setFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Membership Requests</CardTitle>
            <CardDescription>
              {filter === "pending"
                ? "Requests awaiting your review"
                : `${filter} requests`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filter === "pending"
                    ? "No pending requests"
                    : `No ${filter} requests`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          {request.user?.avatar_url ? (
                            <img
                              src={request.user.avatar_url}
                              alt="Avatar"
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {request.user?.first_name}{" "}
                              {request.user?.last_name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={getStatusColor(request.status)}
                            >
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">
                                {request.status}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                            <Mail className="h-3 w-3" />
                            {request.user?.email}
                          </div>
                          {request.reason && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Reason:</strong> {request.reason}
                            </p>
                          )}
                          <div className="text-xs text-gray-500">
                            Requested{" "}
                            {format(
                              new Date(request.created_at),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                            {request.reviewer && (
                              <span className="ml-2">
                                • Reviewed by {request.reviewer.first_name}{" "}
                                {request.reviewer.last_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleRequest(request.id, "approved")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRequest(request.id, "rejected")
                            }
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
