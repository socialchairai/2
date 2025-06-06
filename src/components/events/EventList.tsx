import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Eye,
  RefreshCw,
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface EventListProps {
  onEventSelect?: (event: Event) => void;
}

const EventList: React.FC<EventListProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("upcoming");
  const { user, chapter, role } = useAuth();

  useEffect(() => {
    if (user && chapter) {
      fetchEvents();
    }
  }, [user, chapter]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter, typeFilter, activeTab]);

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
      // Use mock data for demonstration
      setEvents([
        {
          id: "1",
          chapter_id: chapter?.id || "",
          title: "Spring Formal",
          description: "Annual spring formal event",
          type: "formal",
          start_time: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          location: "Grand Ballroom",
          venue: "Downtown Hotel",
          status: "planned",
          visibility: "chapter-only",
          budget_estimate: 5000,
          created_by: user?.id || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          chapter_id: chapter?.id || "",
          title: "Mixer with Sorority",
          description: "Joint mixer event",
          type: "mixer",
          start_time: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          location: "Chapter House",
          status: "completed",
          visibility: "chapter-only",
          created_by: user?.id || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Tab filtering (upcoming vs past)
    const now = new Date();
    if (activeTab === "upcoming") {
      filtered = filtered.filter((event) =>
        isAfter(new Date(event.start_time), now),
      );
    } else {
      filtered = filtered.filter((event) =>
        isBefore(new Date(event.start_time), now),
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.venue?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((event) => event.type === typeFilter);
    }

    setFilteredEvents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "party":
        return "bg-purple-100 text-purple-800";
      case "formal":
        return "bg-indigo-100 text-indigo-800";
      case "mixer":
        return "bg-pink-100 text-pink-800";
      case "philanthropy":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-blue-600" />
              Events Overview
            </h1>
            <p className="mt-1 text-gray-600">View and manage chapter events</p>
          </div>
          <Button variant="outline" onClick={fetchEvents} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="mixer">Mixer</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="philanthropy">Philanthropy</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center text-sm text-gray-600">
                <Filter className="h-4 w-4 mr-2" />
                {filteredEvents.length} events
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No upcoming events
                  </h3>
                  <p className="text-gray-600">
                    No upcoming events match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onEventSelect?.(event)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {event.title}
                          </CardTitle>
                          {event.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1 ml-4">
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <Badge className={getTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {format(new Date(event.start_time), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {format(new Date(event.start_time), "h:mm a")}
                          </span>
                        </div>
                        {(event.location || event.venue) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{event.venue || event.location}</span>
                          </div>
                        )}
                        {event.budget_estimate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">💰</span>
                            <span>
                              ${event.budget_estimate.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventSelect?.(event);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No past events
                  </h3>
                  <p className="text-gray-600">
                    No past events match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-md transition-shadow cursor-pointer opacity-75"
                    onClick={() => onEventSelect?.(event)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {event.title}
                          </CardTitle>
                          {event.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1 ml-4">
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <Badge className={getTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {format(new Date(event.start_time), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {format(new Date(event.start_time), "h:mm a")}
                          </span>
                        </div>
                        {(event.location || event.venue) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{event.venue || event.location}</span>
                          </div>
                        )}
                        {event.budget_estimate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">💰</span>
                            <span>
                              ${event.budget_estimate.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventSelect?.(event);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventList;
