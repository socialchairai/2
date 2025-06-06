import React, { useState } from "react";
import { Event } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  User,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import EventEditForm from "./EventEditForm";

interface EventModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onEventUpdated?: () => void;
}

const EventModal: React.FC<EventModalProps> = ({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onEventUpdated,
}) => {
  const [editFormOpen, setEditFormOpen] = useState(false);
  const { role } = useAuth();

  if (!event) return null;

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
        return <Eye className="h-4 w-4" />;
      case "officers-only":
        return <EyeOff className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
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

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "social":
        return "bg-green-500 text-white";
      case "mixer":
        return "bg-amber-500 text-white";
      case "meeting":
        return "bg-indigo-500 text-white";
      case "philanthropy":
        return "bg-pink-500 text-white";
      case "rush":
        return "bg-purple-500 text-white";
      case "formal":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleEdit = () => {
    setEditFormOpen(true);
  };

  const handleEditFormClose = () => {
    setEditFormOpen(false);
    onEventUpdated?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {event.title}
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
                <Badge
                  className={getEventTypeColor(event.event_type || "other")}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {event.event_type || "other"}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              {event.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {format(
                          new Date(event.start_time),
                          "EEEE, MMMM d, yyyy",
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(event.start_time), "h:mm a")}
                        {event.end_time &&
                          ` - ${format(new Date(event.end_time), "h:mm a")}`}
                      </div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <div className="font-medium">{event.location}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="flex items-center">
                      {getVisibilityIcon(event.visibility)}
                      <span className="ml-2 font-medium">Visibility</span>
                    </div>
                  </div>
                  <Badge className={getVisibilityColor(event.visibility)}>
                    {event.visibility.replace("-", " ").toUpperCase()}
                  </Badge>

                  {event.is_private && (
                    <div className="flex items-center text-sm">
                      <EyeOff className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium text-orange-600">
                        Private Event
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  Created {format(new Date(event.created_at), "MMM d, yyyy")}
                </div>
                {event.updated_at !== event.created_at && (
                  <div>
                    Updated {format(new Date(event.updated_at), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {canManageEvents() && (
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDelete?.(event.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <EventEditForm
        event={event}
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onEventUpdated={handleEditFormClose}
      />
    </>
  );
};

export default EventModal;
