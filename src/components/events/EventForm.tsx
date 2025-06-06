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
import { Calendar, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Event type is required"),
  location: z.string().optional(),
  venue: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional(),
  budget_estimate: z.number().optional(),
  visibility: z.enum(["public", "chapter-only", "officers-only"]),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  onEventCreated?: () => void;
  trigger?: React.ReactNode;
}

const EventForm: React.FC<EventFormProps> = ({ onEventCreated, trigger }) => {
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
      type: "party",
      visibility: "chapter-only",
    },
  });

  const canCreateEvents = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

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
        title: data.title,
        description: data.description || null,
        type: data.type,
        location: data.location || null,
        venue: data.venue || null,
        start_time: data.start_time,
        end_time: data.end_time || null,
        budget_estimate: data.budget_estimate || null,
        visibility: data.visibility,
        chapter_id: chapter.id,
        created_by: user.id,
        status: "planned",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      reset();
      setOpen(false);
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

  return (
    <div className="bg-white p-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] bg-white">
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
                <Label htmlFor="type">Event Type *</Label>
                <Select
                  onValueChange={(value) => setValue("type", value)}
                  defaultValue="party"
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="mixer">Mixer</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="philanthropy">Philanthropy</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.type.message}
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Enter event location"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    {...register("venue")}
                    placeholder="Enter venue name"
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
                  <Label htmlFor="budget_estimate">Budget Estimate</Label>
                  <Input
                    id="budget_estimate"
                    type="number"
                    step="0.01"
                    {...register("budget_estimate", { valueAsNumber: true })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="visibility">Visibility *</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("visibility", value as any)
                    }
                    defaultValue="chapter-only"
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="chapter-only">Chapter Only</SelectItem>
                      <SelectItem value="officers-only">
                        Officers Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
    </div>
  );
};

export default EventForm;
