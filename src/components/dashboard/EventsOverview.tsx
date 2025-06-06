import React, { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  List,
  Plus,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventOverviewData {
  id: string;
  title: string;
  date: Date;
  location: string;
  status: "planning" | "confirmed" | "cancelled";
  attendees: number;
  capacity: number;
  organizer: {
    name: string;
    avatar?: string;
  };
}

interface EventsOverviewProps {
  events?: EventOverviewData[];
}

const EventsOverview = ({ events = mockEvents }: EventsOverviewProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const navigatePreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const navigateNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

  const getStatusColor = (status: EventOverviewData["status"]) => {
    switch (status) {
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Events</CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs
            defaultValue={view}
            onValueChange={(value) => setView(value as "calendar" | "list")}
          >
            <TabsList>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-1" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-1" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Create Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "calendar" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {format(weekStart, "MMMM d")} -{" "}
                {format(weekEnd, "MMMM d, yyyy")}
              </h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navigatePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navigateNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {daysOfWeek.map((day) => (
                <div
                  key={day.toString()}
                  className="border rounded-md p-2 min-h-[150px]"
                >
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`text-lg ${isSameDay(day, new Date()) ? "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {getEventsForDay(day).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
                      >
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {format(event.date, "h:mm a")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      {format(event.date, "MMMM d, yyyy • h:mm a")} •{" "}
                      {event.location}
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge
                        className={getStatusColor(event.status)}
                        variant="outline"
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span>
                                {event.attendees}/{event.capacity}
                              </span>
                              <Progress
                                className="h-2 w-16 ml-2"
                                value={(event.attendees / event.capacity) * 100}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {event.attendees} of {event.capacity} attendees
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={event.organizer.avatar}
                      alt={event.organizer.name}
                    />
                    <AvatarFallback>
                      {event.organizer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mock data for development
const mockEvents: EventOverviewData[] = [
  {
    id: "1",
    title: "Mixer with Alpha Phi",
    date: new Date(),
    location: "Chapter House",
    status: "confirmed",
    attendees: 45,
    capacity: 60,
    organizer: {
      name: "John Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    },
  },
  {
    id: "2",
    title: "Alumni Networking Event",
    date: addDays(new Date(), 2),
    location: "Student Union",
    status: "planning",
    attendees: 20,
    capacity: 50,
    organizer: {
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
  },
  {
    id: "3",
    title: "Philanthropy Fundraiser",
    date: addDays(new Date(), -1),
    location: "Campus Quad",
    status: "cancelled",
    attendees: 0,
    capacity: 100,
    organizer: {
      name: "Mike Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    },
  },
  {
    id: "4",
    title: "Chapter Meeting",
    date: addDays(new Date(), 1),
    location: "Chapter Room",
    status: "confirmed",
    attendees: 35,
    capacity: 40,
    organizer: {
      name: "Emily Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    },
  },
  {
    id: "5",
    title: "Formal Planning Committee",
    date: addDays(new Date(), 3),
    location: "Conference Room B",
    status: "planning",
    attendees: 8,
    capacity: 10,
    organizer: {
      name: "Alex Thompson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
  },
];

export default EventsOverview;
