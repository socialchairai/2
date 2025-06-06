import React from "react";
import { Event } from "@/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  event = {
    id: "1",
    chapter_id: "1",
    title: "Sample Event",
    description: "This is a sample event description",
    location: "Sample Location",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    visibility: "chapter-only",
    created_by: "1",
    status: "planned",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  onEdit,
  onDelete,
  className = "",
}) => {
  const { role } = useAuth();

  const canManageEvents = () => {
    return role?.name === "Social Chair" || role?.name === "Admin";
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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Eye className="h-3 w-3" />;
      case "officers-only":
        return <EyeOff className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "bg-green-100 text-green-800";
      case "officers-only":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <Card className={`bg-white hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Badge className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
            <Badge className={getVisibilityColor(event.visibility)}>
              {getVisibilityIcon(event.visibility)}
              <span className="ml-1 capitalize">
                {event.visibility.replace("-", " ")}
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{format(new Date(event.start_time), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {format(new Date(event.start_time), "h:mm a")}
              {event.end_time &&
                ` - ${format(new Date(event.end_time), "h:mm a")}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {canManageEvents() && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(event)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(event.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
