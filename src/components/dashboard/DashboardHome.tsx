import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BudgetSummary from "./BudgetSummary";
import BudgetCategoryChart from "@/components/budget/BudgetCategoryChart";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import SponsorPanel from "@/components/sponsors/SponsorPanel";
import CalendarView from "@/components/events/CalendarView";
import {
  Calendar,
  Users,
  DollarSign,
  Plus,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  Crown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Event, Notification, Sponsorship } from "@/types/database";
import { format } from "date-fns";

const DashboardHome = () => {
  const { user, chapter, role } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chapter) {
      fetchDashboardData();
    }
  }, [user, chapter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("chapter_id", chapter!.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(3);

      // Fetch recent notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch sponsorships
      const { data: sponsorshipsData } = await supabase
        .from("sponsorships")
        .select("*")
        .eq("chapter_id", chapter!.id)
        .eq("status", "active")
        .order("amount", { ascending: false })
        .limit(3);

      setEvents(eventsData || []);
      setNotifications(notificationsData || []);
      setSponsorships(sponsorshipsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "premium":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "enterprise":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "premium":
      case "enterprise":
        return <Crown className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const canAccessFeature = (feature: string) => {
    if (!role?.name) return false;
    const rolePermissions = {
      "Social Chair": ["events", "budget", "guests"],
      Treasurer: ["budget", "export"],
      Member: ["events_view"],
    };
    return (
      rolePermissions[role.name as keyof typeof rolePermissions]?.includes(
        feature,
      ) || false
    );
  };

  const shouldShowUpgradeBanner = (feature: string) => {
    if (!user?.tier) return true;
    const tierFeatures = {
      analytics: ["premium", "enterprise"],
      export: ["premium", "enterprise"],
      advanced_budget: ["enterprise"],
    };
    return !tierFeatures[feature as keyof typeof tierFeatures]?.includes(
      user.tier,
    );
  };

  if (!user || !chapter || !role) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user.first_name}!
          </h1>
          <p className="mt-1 text-gray-600">
            Here's what's happening with {chapter.chapter_code} Chapter
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge className={getTierBadgeColor(user.tier)}>
            {getTierIcon(user.tier)}
            {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
          </Badge>
          <Badge variant="outline">{role.name}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Members
              </p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Sponsors
              </p>
              <p className="text-2xl font-bold">{sponsorships.length}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Notifications
              </p>
              <p className="text-2xl font-bold">
                {notifications.filter((n) => !n.is_read).length}
              </p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
        </DashboardCard>
      </div>

      {/* Interactive Calendar */}
      {canAccessFeature("events") && (
        <DashboardCard
          title="Event Calendar"
          className="mb-6"
          headerAction={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          }
        >
          <CalendarView
            events={events}
            className="border-0 p-0"
            eventTypeFilter="all"
          />
        </DashboardCard>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        {canAccessFeature("events") && (
          <DashboardCard
            title="Upcoming Events"
            headerAction={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            }
          >
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming events</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Create your first event
                  </Button>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(event.start_time), "MMM d, h:mm a")}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        event.status === "published" ? "default" : "secondary"
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        )}

        {/* Budget Summary */}
        {canAccessFeature("budget") && (
          <DashboardCard maxHeight="max-h-96">
            <BudgetSummary />
          </DashboardCard>
        )}

        {/* Budget Category Chart - Only for Social Chair */}
        {role?.name === "Social Chair" && (
          <BudgetCategoryChart className="lg:col-span-2 xl:col-span-3" />
        )}

        {/* Notifications Panel */}
        <NotificationPanel className="lg:col-span-1" />

        {/* Sponsor Management Panel */}
        <SponsorPanel className="lg:col-span-2 xl:col-span-2" />
      </div>

      {/* Tier Upgrade Banner */}
      {user.tier === "free" && (
        <DashboardCard className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Unlock Premium Features
                </h3>
                <p className="text-sm text-blue-700">
                  Get advanced analytics, budget exports, and priority support
                </p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Upgrade Now
            </Button>
          </div>
        </DashboardCard>
      )}

      {/* Quick Actions for Role */}
      <DashboardCard title={`Quick Actions for ${role.name}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {canAccessFeature("events") && (
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="text-sm font-medium">Create Event</span>
            </Button>
          )}
          {canAccessFeature("guests") && (
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <Users className="h-6 w-6 mb-2 text-green-600" />
              <span className="text-sm font-medium">Guest List</span>
            </Button>
          )}
          {canAccessFeature("budget") && (
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
            >
              <DollarSign className="h-6 w-6 mb-2 text-yellow-600" />
              <span className="text-sm font-medium">Budget</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            <CheckCircle className="h-6 w-6 mb-2 text-purple-600" />
            <span className="text-sm font-medium">Tasks</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
          >
            <Bell className="h-6 w-6 mb-2 text-indigo-600" />
            <span className="text-sm font-medium">Notifications</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center hover:bg-pink-50 hover:border-pink-200 transition-colors"
          >
            <TrendingUp className="h-6 w-6 mb-2 text-pink-600" />
            <span className="text-sm font-medium">Analytics</span>
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default DashboardHome;
