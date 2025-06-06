import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskWithDetails, User } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User as UserIcon,
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithDetails;
  chapterMembers: User[];
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  chapterMembers,
  onTaskUpdate,
  onTaskDelete,
  onTaskEdit,
}) => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canManageTask = () => {
    return (
      role?.name === "Social Chair" ||
      role?.name === "Admin" ||
      task.created_by === user?.id
    );
  };

  const canUpdateStatus = () => {
    return canManageTask() || task.assigned_to === user?.id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === "done") return false;
    return new Date(task.due_date) < new Date();
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!canUpdateStatus()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;

      onTaskUpdate(data);
      toast({
        title: "Success",
        description: "Task status updated successfully!",
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canManageTask()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);

      if (error) throw error;

      onTaskDelete(task.id);
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Placeholder for reminder notification logic
  const checkForReminders = () => {
    if (!task.due_date) return;

    const dueDate = new Date(task.due_date);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    // Placeholder: Check if task is due within 24 hours
    if (hoursDiff <= 24 && hoursDiff > 0 && task.status !== "done") {
      // TODO: Implement actual notification system
      console.log(`Reminder: Task "${task.title}" is due within 24 hours`);
    }
  };

  // Check for reminders on component mount
  React.useEffect(() => {
    checkForReminders();
  }, [task.due_date, task.status]);

  return (
    <>
      <Card
        className={cn(
          "hover:shadow-md transition-shadow",
          isOverdue() && "border-red-200 bg-red-50",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Title and Status */}
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-medium text-lg",
                      task.status === "done" &&
                        "line-through text-muted-foreground",
                    )}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {canUpdateStatus() ? (
                    <Select
                      value={task.status}
                      onValueChange={handleStatusChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {task.assignee && (
                  <span className="flex items-center">
                    <UserIcon className="h-3 w-3 mr-1" />
                    {task.assignee.first_name} {task.assignee.last_name}
                  </span>
                )}
                {task.due_date && (
                  <span
                    className={cn(
                      "flex items-center",
                      isOverdue() && "text-red-500 font-medium",
                    )}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Due {formatDate(task.due_date)}
                    {isOverdue() && <AlertCircle className="h-3 w-3 ml-1" />}
                  </span>
                )}
                {task.event && (
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.event.title}
                  </span>
                )}
              </div>

              {/* Creator info */}
              <div className="text-xs text-gray-400">
                Created by {task.creator?.first_name} {task.creator?.last_name}{" "}
                on {format(new Date(task.created_at), "MMM d, yyyy")}
              </div>
            </div>

            {/* Actions */}
            {canManageTask() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskCard;
