import React, { useState, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import { Event } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Event;
}

interface CalendarViewProps {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  loading?: boolean;
  eventTypeFilter?: string;
  onEventTypeFilterChange?: (type: string) => void;
  className?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events = [],
  onSelectEvent,
  onSelectSlot,
  loading = false,
  eventTypeFilter = "all",
  onEventTypeFilterChange,
  className = "",
}) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // Convert database events to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: event.end_time
        ? new Date(event.end_time)
        : new Date(event.start_time),
      resource: event,
    }));
  }, [events]);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      setSelectedEvent(event.resource);
      setIsEventDialogOpen(true);
      onSelectEvent?.(event.resource);
    },
    [onSelectEvent],
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      onSelectSlot?.(slotInfo);
    },
    [onSelectSlot],
  );

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Custom event style based on event type and status
  const eventStyleGetter = (event: CalendarEvent) => {
    const eventData = event.resource;
    let backgroundColor = "#3174ad";
    let borderColor = "#265985";

    // Color by event type
    switch (eventData.event_type) {
      case "social":
        backgroundColor = "#10b981";
        borderColor = "#059669";
        break;
      case "mixer":
        backgroundColor = "#f59e0b";
        borderColor = "#d97706";
        break;
      case "meeting":
        backgroundColor = "#6366f1";
        borderColor = "#4f46e5";
        break;
      case "philanthropy":
        backgroundColor = "#ec4899";
        borderColor = "#db2777";
        break;
      case "rush":
        backgroundColor = "#8b5cf6";
        borderColor = "#7c3aed";
        break;
      case "formal":
        backgroundColor = "#ef4444";
        borderColor = "#dc2626";
        break;
      default:
        backgroundColor = "#6b7280";
        borderColor = "#4b5563";
    }

    // Adjust opacity for cancelled events
    if (eventData.status === "cancelled") {
      backgroundColor = "#9ca3af";
      borderColor = "#6b7280";
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        border: "none",
        borderRadius: "4px",
        opacity: eventData.status === "cancelled" ? 0.6 : 1,
      },
    };
  };

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("PREV")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("TODAY")}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("NEXT")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-4">{label}</h2>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select
              value={eventTypeFilter}
              onValueChange={onEventTypeFilterChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="mixer">Mixer</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="philanthropy">Philanthropy</SelectItem>
                <SelectItem value="rush">Rush</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant={view === Views.MONTH ? "default" : "outline"}
              size="sm"
              onClick={() => onView(Views.MONTH)}
            >
              Month
            </Button>
            <Button
              variant={view === Views.WEEK ? "default" : "outline"}
              size="sm"
              onClick={() => onView(Views.WEEK)}
            >
              Week
            </Button>
            <Button
              variant={view === Views.DAY ? "default" : "outline"}
              size="sm"
              onClick={() => onView(Views.DAY)}
            >
              Day
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
            }}
            formats={{
              timeGutterFormat: "h:mm A",
              eventTimeRangeFormat: ({ start, end }) =>
                `${moment(start).format("h:mm A")} - ${moment(end).format("h:mm A")}`,
              dayHeaderFormat: "ddd M/D",
              monthHeaderFormat: "MMMM YYYY",
            }}
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 8, 0)}
            max={new Date(2024, 0, 1, 23, 59)}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Event Types
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-500 text-white">Social</Badge>
            <Badge className="bg-amber-500 text-white">Mixer</Badge>
            <Badge className="bg-indigo-500 text-white">Meeting</Badge>
            <Badge className="bg-pink-500 text-white">Philanthropy</Badge>
            <Badge className="bg-purple-500 text-white">Rush</Badge>
            <Badge className="bg-red-500 text-white">Formal</Badge>
            <Badge className="bg-gray-500 text-white">Other</Badge>
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="text-gray-600 mt-1">
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(selectedEvent.start_time), "PPP 'at' p")}
                    {selectedEvent.end_time &&
                      ` - ${format(new Date(selectedEvent.end_time), "p")}`}
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.max_attendees && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Max {selectedEvent.max_attendees} attendees</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      selectedEvent.event_type === "social"
                        ? "bg-green-100 text-green-800"
                        : selectedEvent.event_type === "mixer"
                          ? "bg-amber-100 text-amber-800"
                          : selectedEvent.event_type === "meeting"
                            ? "bg-indigo-100 text-indigo-800"
                            : selectedEvent.event_type === "philanthropy"
                              ? "bg-pink-100 text-pink-800"
                              : selectedEvent.event_type === "rush"
                                ? "bg-purple-100 text-purple-800"
                                : selectedEvent.event_type === "formal"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedEvent.event_type?.charAt(0).toUpperCase() +
                      selectedEvent.event_type?.slice(1) || "Event"}
                  </Badge>
                  <Badge
                    variant={
                      selectedEvent.status === "published"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedEvent.status.charAt(0).toUpperCase() +
                      selectedEvent.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {selectedEvent.budget_estimate && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    Budget Estimate
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ${selectedEvent.budget_estimate.toLocaleString()}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsEventDialogOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarView;
