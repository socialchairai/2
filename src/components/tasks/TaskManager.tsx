import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { EventTask, User, Event } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Plus, Filter, Search, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import TaskItem from "./TaskItem";

interface TaskWithEvent extends EventTask {
  event?: Event;
}

interface TaskManagerProps {
  eventId?: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ eventId }) => {
  const { user, chapter, role } = useAuth();
  const [tasks, setTasks] = useState<TaskWithEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [chapterMembers, setChapterMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "in-progress" | "completed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    | "all"
    | "general"
    | "venue"
    | "catering"
    | "entertainment"
    | "logistics"
    | "promotion"
  >("all");
  const [assigneeFilter, setAssigneeFilter] = useState<
    "all" | "me" | "unassigned"
  >("all");

  // New task form state
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    event_id: eventId || "",
    assigned_to: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    type: "general" as EventTask["type"],
    notes: "",
  });

  useEffect(() => {
    if (chapter) {
      fetchTasks();
      fetchEvents();
      fetchChapterMembers();
    }
  }, [chapter, eventId]);

  const canManageTasks = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  const fetchTasks = async () => {
    if (!chapter) return;

    try {
      let query = supabase
        .from("event_tasks")
        .select(
          `
          *,
          events!inner(*)
        `,
        )
        .eq("events.chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      // If specific event, filter by event_id
      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      // If not social chair, only show assigned tasks
      if (!canManageTasks() && user) {
        query = query.eq("assigned_to", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tasksWithEvents =
        data?.map((task: any) => ({
          ...task,
          event: task.events,
        })) || [];

      setTasks(tasksWithEvents);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!chapter) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("chapter_id", chapter.id)
        .eq("status", "planned")
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
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

      if (error) throw error;

      const members =
        data?.map((link: any) => link.users).filter(Boolean) || [];
      setChapterMembers(members);
    } catch (error) {
      console.error("Error fetching chapter members:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.event_id) return;

    try {
      const { data, error } = await supabase
        .from("event_tasks")
        .insert({
          event_id: newTask.event_id,
          title: newTask.title,
          assigned_to: newTask.assigned_to || null,
          due_date: newTask.due_date || null,
          priority: newTask.priority,
          type: newTask.type,
          notes: newTask.notes || null,
          completed: false,
        })
        .select(
          `
          *,
          events(*)
        `,
        )
        .single();

      if (error) throw error;

      const taskWithEvent = {
        ...data,
        event: data.events,
      };

      setTasks([taskWithEvent, ...tasks]);
      setNewTask({
        title: "",
        event_id: eventId || "",
        assigned_to: "",
        due_date: "",
        priority: "medium",
        type: "general",
        notes: "",
      });
      setNewTaskDialogOpen(false);

      toast({
        title: "Success",
        description: "Task created successfully!",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTaskUpdate = (updatedTask: EventTask) => {
    setTasks(
      tasks.map((task) =>
        task.id === updatedTask.id
          ? { ...updatedTask, event: task.event }
          : task,
      ),
    );
  };

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      // Status filter
      if (filter === "pending" && task.completed) return false;
      if (filter === "completed" && !task.completed) return false;
      if (filter === "in-progress" && (task.completed || !task.assigned_to))
        return false;

      // Search filter
      if (
        searchTerm &&
        !task.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;

      // Type filter
      if (typeFilter !== "all" && task.type !== typeFilter) return false;

      // Assignee filter
      if (assigneeFilter === "me" && task.assigned_to !== user?.id)
        return false;
      if (assigneeFilter === "unassigned" && task.assigned_to) return false;

      return true;
    });
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed && !t.assigned_to).length;
    const inProgress = tasks.filter(
      (t) => !t.completed && t.assigned_to,
    ).length;

    return { total, completed, pending, inProgress };
  };

  const stats = getTaskStats();
  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="bg-white p-6 min-h-screen">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CheckSquare className="h-6 w-6 mr-2 text-blue-600" />
              Task Manager
            </h1>
            <p className="text-gray-600 mt-1">
              {eventId ? "Event Tasks" : "All Chapter Tasks"}
            </p>
          </div>
          {canManageTasks() && (
            <Dialog
              open={newTaskDialogOpen}
              onOpenChange={setNewTaskDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-task-title">Title</Label>
                    <Input
                      id="new-task-title"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      placeholder="Enter task title"
                    />
                  </div>

                  {!eventId && (
                    <div>
                      <Label htmlFor="new-task-event">Event</Label>
                      <Select
                        value={newTask.event_id}
                        onValueChange={(value) =>
                          setNewTask({ ...newTask, event_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="new-task-assignee">Assign To</Label>
                    <Select
                      value={newTask.assigned_to}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, assigned_to: value })
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-task-priority">Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) =>
                          setNewTask({
                            ...newTask,
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
                      <Label htmlFor="new-task-type">Type</Label>
                      <Select
                        value={newTask.type}
                        onValueChange={(value) =>
                          setNewTask({
                            ...newTask,
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
                  </div>

                  <div>
                    <Label htmlFor="new-task-due-date">Due Date</Label>
                    <Input
                      id="new-task-due-date"
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) =>
                        setNewTask({ ...newTask, due_date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-task-notes">Notes</Label>
                    <Textarea
                      id="new-task-notes"
                      value={newTask.notes}
                      onChange={(e) =>
                        setNewTask({ ...newTask, notes: e.target.value })
                      }
                      placeholder="Add any additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setNewTaskDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask}>Create Task</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.inProgress}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as any)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={assigneeFilter}
                onValueChange={(value) => setAssigneeFilter(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="me">My Tasks</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as any)}
            >
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  In Progress ({stats.inProgress})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({stats.completed})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[600px]">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No tasks found</p>
                    {canManageTasks() && (
                      <Button
                        variant="link"
                        onClick={() => setNewTaskDialogOpen(true)}
                        className="mt-2"
                      >
                        Create your first task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id}>
                        <TaskItem
                          task={task}
                          chapterMembers={chapterMembers}
                          onTaskUpdate={handleTaskUpdate}
                        />
                        {task.event && !eventId && (
                          <div className="ml-8 mt-2 text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {task.event.title}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskManager;
