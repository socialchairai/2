import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface NotificationPanelProps {
  className?: string;
  maxHeight?: string;
}

const NotificationPanel = ({
  className = "",
  maxHeight = "max-h-96",
}: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "budget":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "sponsor":
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case "reminder":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "event":
        return "bg-blue-100 text-blue-800";
      case "budget":
        return "bg-green-100 text-green-800";
      case "sponsor":
        return "bg-purple-100 text-purple-800";
      case "reminder":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <Card className={`bg-white ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={`${maxHeight} px-6 pb-6`}>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                      notification.is_read
                        ? "bg-white"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <div
                      className={`p-1 rounded-full ${
                        notification.type === "event"
                          ? "bg-blue-100"
                          : notification.type === "budget"
                            ? "bg-green-100"
                            : notification.type === "sponsor"
                              ? "bg-purple-100"
                              : notification.type === "reminder"
                                ? "bg-orange-100"
                                : "bg-gray-100"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                            >
                              {notification.type.charAt(0).toUpperCase() +
                                notification.type.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(
                                new Date(notification.created_at),
                                "MMM d, h:mm a",
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;
