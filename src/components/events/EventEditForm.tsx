import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional(),
  visibility: z.enum(["public", "chapter-only", "officers-only"]),
  status: z.enum(["planned", "active", "cancelled", "completed"]),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventEditFormProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
}

const EventEditForm: React.FC<EventEditFormProps> = ({
  event,
  open,
  onOpenChange,
  onEventUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const { role } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const canEditEvents = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  // Format datetime for input
  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  useEffect(() => {
    if (event && open) {
      reset({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        start_time: formatDateTimeForInput(event.start_time),
        end_time: event.end_time ? formatDateTimeForInput(event.end_time) : "",
        visibility: event.visibility,
        status: event.status,
      });
    }
  }, [event, open, reset]);

  const onSubmit = async (data: EventFormData) => {
    if (!canEditEvents()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit events.",
        variant: "destructive",
      });
      return;
    }

    if (!event) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          start_time: data.start_time,
          end_time: data.end_time || null,
          visibility: data.visibility,
          status: data.status,
        })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully!",
      });

      onOpenChange(false);
      onEventUpdated?.();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canEditEvents()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Edit Event
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter event title"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter event description"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Enter event location"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Date & Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register("start_time")}
                  className="mt-1"
                />
                {errors.start_time && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.start_time.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="end_time">End Date & Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  {...register("end_time")}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visibility">Visibility *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("visibility", value as any)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="chapter-only">Chapter Only</SelectItem>
                    <SelectItem value="officers-only">Officers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  onValueChange={(value) => setValue("status", value as any)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventEditForm;
