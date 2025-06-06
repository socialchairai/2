import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { EventTask, User } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  User as UserIcon,
  Edit,
  MessageSquare,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: EventTask;
  chapterMembers: User[];
  onTaskUpdate: (updatedTask: EventTask) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  chapterMembers,
  onTaskUpdate,
}) => {
  const { user, role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [loading, setLoading] = useState(false);

  const canManageTask = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  const canCompleteTask = () => {
    return canManageTask() || task.assigned_to === user?.id;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-500 bg-amber-50 border-amber-200";
      case "low":
        return "text-green-500 bg-green-50 border-green-200";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <Clock className="h-4 w-4" />;
      case "low":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "venue":
        return "bg-blue-100 text-blue-800";
      case "catering":
        return "bg-green-100 text-green-800";
      case "entertainment":
        return "bg-purple-100 text-purple-800";
      case "logistics":
        return "bg-orange-100 text-orange-800";
      case "promotion":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAssigneeName = (userId: string) => {
    const member = chapterMembers.find((m) => m.id === userId);
    return member ? `${member.first_name} ${member.last_name}` : "Unknown";
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const isOverdue = (date: string) => {
    return new Date(date) < new Date() && !task.completed;
  };

  const handleToggleComplete = async () => {
    if (!canCompleteTask()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;

      onTaskUpdate(data);
      toast({
        title: "Success",
        description: `Task ${!task.completed ? "completed" : "reopened"} successfully!`,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!canManageTask()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_tasks")
        .update({
          title: editedTask.title,
          assigned_to: editedTask.assigned_to || null,
          due_date: editedTask.due_date || null,
          priority: editedTask.priority,
          type: editedTask.type,
          notes: editedTask.notes || null,
        })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;

      onTaskUpdate(data);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={handleToggleComplete}
            disabled={!canCompleteTask() || loading}
            className="mt-1"
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-slate-300 hover:text-slate-500" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3
                className={cn(
                  "font-medium",
                  task.completed && "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </h3>
              <div
                className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs border",
                  getPriorityColor(task.priority),
                )}
              >
                {getPriorityIcon(task.priority)}
                <span className="capitalize">{task.priority}</span>
              </div>
              <Badge
                variant="secondary"
                className={cn("text-xs", getTypeColor(task.type))}
              >
                {task.type}
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {task.assigned_to && (
                <span className="flex items-center">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {getAssigneeName(task.assigned_to)}
                </span>
              )}
              {task.due_date && (
                <span
                  className={cn(
                    "flex items-center",
                    isOverdue(task.due_date) && "text-red-500",
                  )}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Due {formatDate(task.due_date)}
                </span>
              )}
            </div>

            {task.notes && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                <div className="flex items-center mb-1">
                  <MessageSquare className="h-3 w-3 mr-1 text-slate-500" />
                  <span className="text-slate-600 font-medium">Notes:</span>
                </div>
                <p className="text-slate-700">{task.notes}</p>
              </div>
            )}
          </div>
        </div>

        {canManageTask() && (
          <div className="flex items-center space-x-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Title</Label>
                    <Input
                      id="task-title"
                      value={editedTask.title}
                      onChange={(e) =>
                        setEditedTask({ ...editedTask, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-assignee">Assign To</Label>
                    <Select
                      value={editedTask.assigned_to || ""}
                      onValueChange={(value) =>
                        setEditedTask({
                          ...editedTask,
                          assigned_to: value || undefined,
                        })
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

                  <div>
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      value={editedTask.priority}
                      onValueChange={(value) =>
                        setEditedTask({
                          ...editedTask,
                          priority: value as "low" | "medium" | "high",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="task-type">Type</Label>
                    <Select
                      value={editedTask.type}
                      onValueChange={(value) =>
                        setEditedTask({
                          ...editedTask,
                          type: value as EventTask["type"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="entertainment">
                          Entertainment
                        </SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input
                      id="task-due-date"
                      type="datetime-local"
                      value={editedTask.due_date || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          due_date: e.target.value || undefined,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-notes">Notes</Label>
                    <Textarea
                      id="task-notes"
                      value={editedTask.notes || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          notes: e.target.value || undefined,
                        })
                      }
                      placeholder="Add any additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={loading}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
