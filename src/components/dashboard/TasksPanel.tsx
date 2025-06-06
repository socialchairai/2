import React, { useState } from "react";
import {
  PlusCircle,
  Filter,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskPanelData {
  id: string;
  title: string;
  eventId: string;
  eventName: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  assignedTo?: string;
}

interface TasksPanelProps {
  tasks?: TaskPanelData[];
  onCreateTask?: () => void;
  onUpdateTaskStatus?: (
    taskId: string,
    status: "pending" | "in-progress" | "completed",
  ) => void;
}

const TasksPanel = ({
  tasks = [
    {
      id: "1",
      title: "Book venue for Spring Formal",
      eventId: "event1",
      eventName: "Spring Formal",
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      priority: "high",
      status: "pending",
    },
    {
      id: "2",
      title: "Order catering",
      eventId: "event1",
      eventName: "Spring Formal",
      dueDate: new Date(Date.now() + 172800000), // day after tomorrow
      priority: "medium",
      status: "in-progress",
      assignedTo: "Alex Johnson",
    },
    {
      id: "3",
      title: "Confirm DJ availability",
      eventId: "event1",
      eventName: "Spring Formal",
      dueDate: new Date(Date.now() + 259200000), // 3 days from now
      priority: "medium",
      status: "completed",
    },
    {
      id: "4",
      title: "Create event budget",
      eventId: "event2",
      eventName: "Philanthropy Event",
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      priority: "high",
      status: "pending",
    },
    {
      id: "5",
      title: "Contact potential sponsors",
      eventId: "event2",
      eventName: "Philanthropy Event",
      dueDate: new Date(Date.now() + 345600000), // 4 days from now
      priority: "low",
      status: "pending",
    },
  ],
  onCreateTask = () => console.log("Create task clicked"),
  onUpdateTaskStatus = (taskId, status) =>
    console.log(`Task ${taskId} status updated to ${status}`),
}: TasksPanelProps) => {
  const [filter, setFilter] = useState<
    "all" | "pending" | "in-progress" | "completed"
  >("all");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-green-500";
      default:
        return "text-slate-500";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <AlertCircle className={cn("h-4 w-4", getPriorityColor(priority))} />
        );
      case "medium":
        return <Clock className={cn("h-4 w-4", getPriorityColor(priority))} />;
      case "low":
        return <Circle className={cn("h-4 w-4", getPriorityColor(priority))} />;
      default:
        return <Circle className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const isOverdue = (date: Date) => {
    return date < new Date();
  };

  const handleStatusChange = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus =
      task.status === "pending"
        ? "in-progress"
        : task.status === "in-progress"
          ? "completed"
          : "pending";

    onUpdateTaskStatus(taskId, newStatus);
  };

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter tasks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="sm" onClick={onCreateTask}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(value) => setFilter(value as any)}
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[280px] pr-4">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground">No tasks found</p>
                <Button variant="link" onClick={onCreateTask} className="mt-2">
                  Create a new task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleStatusChange(task.id)}
                        className="mt-0.5"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p
                            className={cn(
                              "font-medium",
                              task.status === "completed" &&
                                "line-through text-muted-foreground",
                            )}
                          >
                            {task.title}
                          </p>
                          {getPriorityIcon(task.priority)}
                        </div>
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <span className="mr-2">{task.eventName}</span>
                          <span
                            className={cn(
                              isOverdue(task.dueDate) &&
                                task.status !== "completed"
                                ? "text-red-500"
                                : "",
                            )}
                          >
                            Due {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.assignedTo && (
                        <Badge variant="outline" className="text-xs">
                          {task.assignedTo}
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          task.status === "pending" &&
                            "bg-yellow-100 text-yellow-800",
                          task.status === "in-progress" &&
                            "bg-blue-100 text-blue-800",
                          task.status === "completed" &&
                            "bg-green-100 text-green-800",
                        )}
                      >
                        {task.status === "in-progress"
                          ? "In Progress"
                          : task.status.charAt(0).toUpperCase() +
                            task.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TasksPanel;
