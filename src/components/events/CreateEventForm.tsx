import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  event_type: z.enum([
    "social",
    "mixer",
    "meeting",
    "philanthropy",
    "rush",
    "formal",
    "other",
  ]),
  location: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional(),
  visibility: z.enum(["public", "chapter-only", "officers-only"]),
  is_private: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
  trigger?: React.ReactNode;
  onEventCreated?: () => void;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
  trigger,
  onEventCreated,
  defaultStartTime,
  defaultEndTime,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, chapter, role } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: "other",
      visibility: "chapter-only",
      is_private: false,
    },
  });

  const canCreateEvents = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  // Format datetime for input
  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  React.useEffect(() => {
    if (open && defaultStartTime) {
      setValue("start_time", formatDateTimeForInput(defaultStartTime));
      if (defaultEndTime) {
        setValue("end_time", formatDateTimeForInput(defaultEndTime));
      }
    }
  }, [open, defaultStartTime, defaultEndTime, setValue]);

  const onSubmit = async (data: EventFormData) => {
    if (!canCreateEvents()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create events.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !chapter) {
      toast({
        title: "Error",
        description: "User or chapter information is missing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("events").insert({
        chapter_id: chapter.id,
        title: data.title,
        description: data.description || null,
        event_type: data.event_type,
        location: data.location || null,
        start_time: data.start_time,
        end_time: data.end_time || null,
        visibility: data.visibility,
        is_private: data.is_private,
        created_by: user.id,
        status: "planned",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      setOpen(false);
      reset();
      onEventCreated?.();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateEvents()) {
    return null;
  }

  const defaultTrigger = (
    <Button className="bg-blue-600 hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-2" />
      Create Event
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Create New Event
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_type">Event Type *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("event_type", value as any)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="mixer">Mixer</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="philanthropy">Philanthropy</SelectItem>
                    <SelectItem value="rush">Rush</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="is_private"
                  checked={watch("is_private")}
                  onCheckedChange={(checked) =>
                    setValue("is_private", checked as boolean)
                  }
                />
                <Label htmlFor="is_private" className="text-sm">
                  Mark as private event
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventForm;
