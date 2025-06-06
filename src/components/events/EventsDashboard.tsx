import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/types/database";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EventCard from "./EventCard";
import EventForm from "./EventForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const EventsDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const { user, chapter, role } = useAuth();

  useEffect(() => {
    if (user && chapter) {
      fetchEvents();
    }
  }, [user, chapter]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter]);

  const fetchEvents = async () => {
    if (!chapter) return;

    setLoading(true);
    try {
      let query = supabase
        .from("events")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("start_time", { ascending: true });

      // Apply visibility filtering based on user role
      if (role?.name !== "Social Chair" && role?.name !== "Admin") {
        if (role?.name === "Officer") {
          query = query.in("visibility", [
            "public",
            "chapter-only",
            "officers-only",
          ]);
        } else {
          query = query.in("visibility", ["public", "chapter-only"]);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleEditEvent = (event: Event) => {
    // This would open an edit modal - for now we'll just show a toast
    toast({
      title: "Edit Event",
      description: `Edit functionality for ${event.title} will be implemented.`,
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });

      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteEventId(null);
    }
  };

  const canManageEvents = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter((event) => new Date(event.start_time) > now);
  };

  const getTotalBudget = () => {
    return events.reduce(
      (total, event) => total + (event.budget_estimate || 0),
      0,
    );
  };

  const getEventStats = () => {
    const upcoming = getUpcomingEvents();
    const thisMonth = events.filter((event) => {
      const eventDate = new Date(event.start_time);
      const now = new Date();
      return (
        eventDate.getMonth() === now.getMonth() &&
        eventDate.getFullYear() === now.getFullYear()
      );
    });

    return {
      total: events.length,
      upcoming: upcoming.length,
      thisMonth: thisMonth.length,
      totalBudget: getTotalBudget(),
    };
  };

  const stats = getEventStats();

  if (!user || !chapter || !role) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-blue-600" />
              Events Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Manage your chapter events and planning
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button variant="outline" onClick={fetchEvents} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {canManageEvents() && (
              <EventForm
                onEventCreated={fetchEvents}
                trigger={
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time events</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Events
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <p className="text-xs text-muted-foreground">
                Events scheduled ahead
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">Events this month</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Budget
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalBudget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Estimated budget</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Events</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="bg-white p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {events.length === 0
                  ? "No events yet"
                  : "No events match your filters"}
              </h3>
              <p className="text-gray-600 mb-6">
                {events.length === 0
                  ? "Get started by creating your first event"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {canManageEvents() && events.length === 0 && (
                <EventForm
                  onEventCreated={fetchEvents}
                  trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Event
                    </Button>
                  }
                />
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEditEvent}
                  onDelete={(eventId) => setDeleteEventId(eventId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteEventId}
          onOpenChange={() => setDeleteEventId(null)}
        >
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Delete Event
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteEventId && handleDeleteEvent(deleteEventId)
                }
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default EventsDashboard;
