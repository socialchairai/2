import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Search } from "lucide-react";

interface JoinChapterRequestFormProps {
  onRequestSent?: () => void;
}

export default function JoinChapterRequestForm({
  onRequestSent,
}: JoinChapterRequestFormProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("");
  const [fraternityName, setFraternityName] = useState("");
  const [chapterCode, setChapterCode] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundChapter, setFoundChapter] = useState<any>(null);

  const searchChapter = async () => {
    if (!schoolName || !fraternityName || !chapterCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all chapter details to search.",
        variant: "destructive",
      });
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("school_name", schoolName)
        .eq("fraternity_name", fraternityName)
        .eq("chapter_code", chapterCode)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({
          title: "Chapter not found",
          description: "No active chapter found with those details.",
          variant: "destructive",
        });
        setFoundChapter(null);
        return;
      }

      // Check if user is already a member
      const { data: existingLink } = await supabase
        .from("user_chapter_links")
        .select("*")
        .eq("user_id", user?.id)
        .eq("chapter_id", data.id)
        .eq("is_active", true)
        .single();

      if (existingLink) {
        toast({
          title: "Already a member",
          description: "You are already a member of this chapter.",
          variant: "destructive",
        });
        return;
      }

      // Check if user already has a pending request
      const { data: existingRequest } = await supabase
        .from("chapter_join_requests")
        .select("*")
        .eq("user_id", user?.id)
        .eq("chapter_id", data.id)
        .eq("status", "pending")
        .single();

      if (existingRequest) {
        toast({
          title: "Request already exists",
          description: "You already have a pending request for this chapter.",
          variant: "destructive",
        });
        return;
      }

      setFoundChapter(data);
      toast({
        title: "Chapter found!",
        description: `Found ${data.fraternity_name} at ${data.school_name}`,
      });
    } catch (error) {
      console.error("Error searching chapter:", error);
      toast({
        title: "Error",
        description: "Failed to search for chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !foundChapter) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("chapter_join_requests").insert({
        user_id: user.id,
        chapter_id: foundChapter.id,
        reason: reason.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your join request has been submitted for review.",
      });

      // Reset form
      setSchoolName("");
      setFraternityName("");
      setChapterCode("");
      setReason("");
      setFoundChapter(null);
      onRequestSent?.();
    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Request to Join Chapter
        </CardTitle>
        <CardDescription>
          Search for a chapter and request to join as a member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                placeholder="e.g., University of California"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fraternityName">Fraternity Name</Label>
              <Input
                id="fraternityName"
                placeholder="e.g., Alpha Beta Gamma"
                value={fraternityName}
                onChange={(e) => setFraternityName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapterCode">Chapter Code</Label>
            <Input
              id="chapterCode"
              placeholder="e.g., Alpha Beta"
              value={chapterCode}
              onChange={(e) => setChapterCode(e.target.value)}
              required
            />
          </div>

          <Button
            type="button"
            onClick={searchChapter}
            disabled={
              searchLoading || !schoolName || !fraternityName || !chapterCode
            }
            variant="outline"
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {searchLoading ? "Searching..." : "Search Chapter"}
          </Button>

          {foundChapter && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">
                Chapter Found!
              </h4>
              <p className="text-green-700">
                {foundChapter.fraternity_name} - {foundChapter.chapter_code}
              </p>
              <p className="text-green-600 text-sm">
                {foundChapter.school_name}
              </p>
            </div>
          )}

          {foundChapter && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Joining (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Tell us why you'd like to join this chapter..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !foundChapter}
            className="w-full"
          >
            {loading ? "Sending Request..." : "Send Join Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
