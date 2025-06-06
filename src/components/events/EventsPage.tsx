import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/types/database";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CalendarView from "./CalendarView";
import EventModal from "./EventModal";
import CreateEventForm from "./CreateEventForm";
import EventCard from "./EventCard";
import EventEditForm from "./EventEditForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  Grid,
  List,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [createEventSlot, setCreateEventSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");
  const { user, chapter, role } = useAuth();

  useEffect(() => {
    if (user && chapter) {
      fetchEvents();
    }
  }, [user, chapter]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter, visibilityFilter, eventTypeFilter]);

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

    // Visibility filter
    if (visibilityFilter !== "all") {
      filtered = filtered.filter(
        (event) => event.visibility === visibilityFilter,
      );
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(
        (event) => event.event_type === eventTypeFilter,
      );
    }

    setFilteredEvents(filtered);
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (canManageEvents()) {
      setCreateEventSlot(slotInfo);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditFormOpen(true);
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
              Events Calendar
            </h1>
            <p className="mt-1 text-gray-600">Manage and view chapter events</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button variant="outline" onClick={fetchEvents} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {canManageEvents() && (
              <CreateEventForm
                onEventCreated={fetchEvents}
                defaultStartTime={createEventSlot?.start}
                defaultEndTime={createEventSlot?.end}
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

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="calendar" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center">
                <List className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
            </TabsList>

            {/* Filters - only show in list view */}
            {activeTab === "list" && (
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={visibilityFilter}
                    onValueChange={setVisibilityFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="chapter-only">Chapter</SelectItem>
                      <SelectItem value="officers-only">Officers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-0">
            <CalendarView
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              loading={loading}
              eventTypeFilter={eventTypeFilter}
              onEventTypeFilterChange={setEventTypeFilter}
            />
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
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
                  <CreateEventForm
                    onEventCreated={fetchEvents}
                    trigger={
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    }
                  />
                )}
              </div>
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
          </TabsContent>
        </Tabs>

        {/* Event Detail Modal */}
        <EventModal
          event={selectedEvent}
          open={eventModalOpen}
          onOpenChange={setEventModalOpen}
          onEdit={handleEditEvent}
          onDelete={(eventId) => setDeleteEventId(eventId)}
          onEventUpdated={fetchEvents}
        />

        {/* Edit Event Dialog */}
        <EventEditForm
          event={editingEvent}
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          onEventUpdated={fetchEvents}
        />

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

export default EventsPage;
