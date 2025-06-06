import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskWithDetails, User, Event } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

interface TaskListProps {
  eventId?: string;
  showCreateButton?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  eventId,
  showCreateButton = true,
}) => {
  const { user, chapter, role } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithDetails[]>([]);
  const [chapterMembers, setChapterMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "todo" | "in_progress" | "done"
  >("all");
  const [assigneeFilter, setAssigneeFilter] = useState<
    "all" | "me" | "unassigned"
  >("all");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (chapter) {
      fetchTasks();
      fetchChapterMembers();
      fetchEvents();
    }
  }, [chapter, eventId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, statusFilter, assigneeFilter]);

  const canManageTasks = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  const fetchTasks = async () => {
    if (!chapter) return;

    try {
      let query = supabase.from("tasks").select(`
          *,
          assignee:assigned_to(id, first_name, last_name, email),
          creator:created_by(id, first_name, last_name, email),
          event:event_id(id, title, start_time)
        `);

      // If specific event, filter by event_id
      if (eventId) {
        query = query.eq("event_id", eventId);
      } else {
        // For general task list, get tasks from user's chapter
        // We need to join through events or created_by to filter by chapter
        const { data: chapterEvents } = await supabase
          .from("events")
          .select("id")
          .eq("chapter_id", chapter.id);

        const eventIds = chapterEvents?.map((e) => e.id) || [];

        if (eventIds.length > 0) {
          query = query.or(
            `event_id.in.(${eventIds.join(",")}),created_by.eq.${user?.id}`,
          );
        } else {
          query = query.eq("created_by", user?.id || "");
        }
      }

      // If not social chair/admin, only show assigned tasks or own created tasks
      if (!canManageTasks() && user) {
        query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      const tasksWithDetails: TaskWithDetails[] = (data || []).map(
        (task: any) => ({
          ...task,
          assignee: task.assignee,
          creator: task.creator,
          event: task.event,
        }),
      );

      setTasks(tasksWithDetails);
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

  const fetchEvents = async () => {
    if (!chapter) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("chapter_id", chapter.id)
        .in("status", ["planned", "active"])
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Assignee filter
    if (assigneeFilter === "me") {
      filtered = filtered.filter((task) => task.assigned_to === user?.id);
    } else if (assigneeFilter === "unassigned") {
      filtered = filtered.filter((task) => !task.assigned_to);
    }

    setFilteredTasks(filtered);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
      ),
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleTaskCreated = (newTask: Task) => {
    // Refetch to get the task with all relations
    fetchTasks();
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const getStatusStats = () => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { total, todo, inProgress, done };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="bg-white p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-gray-600 mt-1">
            {eventId ? "Event Tasks" : "All Tasks"}
          </p>
        </div>
        {showCreateButton && canManageTasks() && (
          <Button onClick={() => setShowTaskForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
            <div className="text-sm text-gray-600">To Do</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.done}
            </div>
            <div className="text-sm text-gray-600">Done</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
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
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
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

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No tasks found</p>
                {canManageTasks() && (
                  <Button
                    variant="link"
                    onClick={() => setShowTaskForm(true)}
                    className="mt-2"
                  >
                    Create your first task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    chapterMembers={chapterMembers}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    onTaskEdit={handleEditTask}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          chapterMembers={chapterMembers}
          events={events}
          eventId={eventId}
          onTaskCreated={handleTaskCreated}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TaskList;
