import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Task, User, Event } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/components/ui/use-toast";

interface TaskFormProps {
  task?: Task | null;
  chapterMembers: User[];
  events: Event[];
  eventId?: string;
  onTaskCreated: (task: Task) => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  chapterMembers,
  events,
  eventId,
  onTaskCreated,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as "todo" | "in_progress" | "done",
    due_date: "",
    assigned_to: "",
    event_id: eventId || "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        due_date: task.due_date
          ? new Date(task.due_date).toISOString().slice(0, 16)
          : "",
        assigned_to: task.assigned_to || "",
        event_id: task.event_id || "",
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !user) return;

    setLoading(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        due_date: formData.due_date
          ? new Date(formData.due_date).toISOString()
          : null,
        assigned_to: formData.assigned_to || null,
        event_id: formData.event_id || null,
        created_by: user.id,
      };

      if (task) {
        // Update existing task
        const { data, error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id)
          .select()
          .single();

        if (error) throw error;

        onTaskCreated(data);
        toast({
          title: "Success",
          description: "Task updated successfully!",
        });
      } else {
        // Create new task
        const { data, error } = await supabase
          .from("tasks")
          .insert(taskData)
          .select()
          .single();

        if (error) throw error;

        onTaskCreated(data);
        toast({
          title: "Success",
          description: "Task created successfully!",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) =>
                  handleInputChange("assigned_to", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {chapterMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => handleInputChange("due_date", e.target.value)}
            />
          </div>

          {!eventId && (
            <div>
              <Label htmlFor="event_id">Related Event</Label>
              <Select
                value={formData.event_id}
                onValueChange={(value) => handleInputChange("event_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
