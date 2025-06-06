import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event, EventTask, EventChecklist, User } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  CheckSquare,
  Plus,
  User as UserIcon,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import TaskManager from "@/components/tasks/TaskManager";

interface PartyBuilderDashboardProps {
  eventId?: string;
}

const PartyBuilderDashboard: React.FC<PartyBuilderDashboardProps> = ({
  eventId = "sample-event-id",
}) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [checklist, setChecklist] = useState<EventChecklist[]>([]);
  const [chapterMembers, setChapterMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const { user, chapter, role } = useAuth();

  useEffect(() => {
    if (eventId && chapter) {
      fetchEventData();
      fetchChapterMembers();
    }
  }, [eventId, chapter]);

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError && eventError.code !== "PGRST116") {
        console.error("Error fetching event:", eventError);
        // Use mock data if event not found
        setEvent({
          id: eventId,
          chapter_id: chapter?.id || "",
          title: "Sample Party Event",
          description: "A sample party event for demonstration",
          type: "party",
          start_time: new Date().toISOString(),
          location: "Sample Location",
          venue: "Sample Venue",
          status: "planned",
          visibility: "chapter-only",
          created_by: user?.id || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setEvent(eventData);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("event_tasks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (tasksError && tasksError.code !== "PGRST116") {
        console.error("Error fetching tasks:", tasksError);
        setTasks([]);
      } else {
        setTasks(tasksData || []);
      }

      // Fetch checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from("event_checklists")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (checklistError && checklistError.code !== "PGRST116") {
        console.error("Error fetching checklist:", checklistError);
        setChecklist([]);
      } else {
        setChecklist(checklistData || []);
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapterMembers = async () => {
    if (!chapter) return;

    try {
      const { data, error } = await supabase
        .from("user_chapter_links")
        .select(
          `
          users(*)
        `,
        )
        .eq("chapter_id", chapter.id)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching chapter members:", error);
        setChapterMembers([]);
      } else {
        const members =
          data?.map((link: any) => link.users).filter(Boolean) || [];
        setChapterMembers(members);
      }
    } catch (error) {
      console.error("Error fetching chapter members:", error);
      setChapterMembers([]);
    }
  };

  const canManageEvent = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from("event_tasks")
        .insert({
          event_id: eventId,
          title: newTaskTitle,
          assigned_to: newTaskAssignee || null,
          due_date: newTaskDueDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setNewTaskTitle("");
      setNewTaskAssignee("");
      setNewTaskDueDate("");
      setTaskDialogOpen(false);

      toast({
        title: "Success",
        description: "Task added successfully!",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("event_tasks")
        .update({ completed })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, completed } : task,
        ),
      );
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("event_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      setTasks(tasks.filter((task) => task.id !== taskId));

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
    }
  };

  const addChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;

    try {
      const { data, error } = await supabase
        .from("event_checklists")
        .insert({
          event_id: eventId,
          item: newChecklistItem,
        })
        .select()
        .single();

      if (error) throw error;

      setChecklist([...checklist, data]);
      setNewChecklistItem("");
      setChecklistDialogOpen(false);

      toast({
        title: "Success",
        description: "Checklist item added successfully!",
      });
    } catch (error) {
      console.error("Error adding checklist item:", error);
      toast({
        title: "Error",
        description: "Failed to add checklist item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("event_checklists")
        .update({ completed })
        .eq("id", itemId);

      if (error) throw error;

      setChecklist(
        checklist.map((item) =>
          item.id === itemId ? { ...item, completed } : item,
        ),
      );
    } catch (error) {
      console.error("Error updating checklist item:", error);
      toast({
        title: "Error",
        description: "Failed to update checklist item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("event_checklists")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setChecklist(checklist.filter((item) => item.id !== itemId));

      toast({
        title: "Success",
        description: "Checklist item deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      toast({
        title: "Error",
        description: "Failed to delete checklist item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAssigneeName = (userId: string) => {
    const member = chapterMembers.find((m) => m.id === userId);
    return member ? `${member.first_name} ${member.last_name}` : "Unknown";
  };

  if (loading) {
    return (
      <div className="bg-white p-6 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading event dashboard...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-white p-6 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-600">Event not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Event Header */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                  {event.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">{event.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>
                    📅{" "}
                    {format(
                      new Date(event.start_time),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </span>
                  {event.location && <span>📍 {event.location}</span>}
                  {event.venue && <span>🏢 {event.venue}</span>}
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 capitalize">
                {event.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Task Manager Integration */}
        <div className="mt-6">
          <TaskManager eventId={eventId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Checklist Section */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Checklist ({checklist.filter((c) => c.completed).length}/
                  {checklist.length})
                </CardTitle>
                {canManageEvent() && (
                  <Dialog
                    open={checklistDialogOpen}
                    onOpenChange={setChecklistDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Add Checklist Item</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="checklist-item">Item</Label>
                          <Input
                            id="checklist-item"
                            value={newChecklistItem}
                            onChange={(e) =>
                              setNewChecklistItem(e.target.value)
                            }
                            placeholder="Enter checklist item"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setChecklistDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={addChecklistItem}>Add Item</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No checklist items yet
                  </p>
                ) : (
                  checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={(checked) =>
                            toggleChecklistItem(item.id, checked as boolean)
                          }
                        />
                        <p
                          className={`${item.completed ? "line-through text-gray-500" : ""}`}
                        >
                          {item.item}
                        </p>
                      </div>
                      {canManageEvent() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChecklistItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PartyBuilderDashboard;
