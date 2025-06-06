import React from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Mock data for demo
const mockUser = {
  id: "demo-user",
  first_name: "Demo",
  last_name: "User",
  email: "demo@example.com",
  tier: "free" as const,
  status: "active" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockChapter = {
  id: "demo-chapter",
  school_name: "Demo University",
  fraternity_name: "Alpha Beta Gamma",
  chapter_code: "Rho Delta",
  location: "Demo City, ST",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockRole = {
  id: "demo-role",
  name: "Social Chair",
  description: "Manages chapter events and social activities",
  permissions: {},
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockEvents = [
  {
    id: "1",
    chapter_id: "demo-chapter",
    title: "Spring Formal",
    description: "Annual spring formal event",
    start_time: addDays(new Date(), 7).toISOString(),
    location: "Grand Ballroom",
    status: "published" as const,
    budget_estimate: 5000,
    visibility: "chapter-only" as const,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    chapter_id: "demo-chapter",
    title: "Mixer with Sorority",
    description: "Joint mixer event",
    start_time: addDays(new Date(), 14).toISOString(),
    location: "Chapter House",
    status: "published" as const,
    budget_estimate: 1500,
    visibility: "chapter-only" as const,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    chapter_id: "demo-chapter",
    title: "Brotherhood Retreat",
    description: "Annual brotherhood retreat",
    start_time: addDays(new Date(), 21).toISOString(),
    location: "Mountain Lodge",
    status: "planned" as const,
    budget_estimate: 3000,
    visibility: "chapter-only" as const,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockNotifications = [
  {
    id: "1",
    user_id: "demo-user",
    message: "Spring Formal budget approved",
    created_at: new Date().toISOString(),
    is_read: false,
    type: "budget" as const,
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "demo-user",
    message: "New RSVP for mixer event",
    created_at: addDays(new Date(), -1).toISOString(),
    is_read: false,
    type: "event" as const,
    updated_at: new Date().toISOString(),
  },
];

const mockSponsorships = [
  {
    id: "1",
    chapter_id: "demo-chapter",
    sponsor_name: "Local Restaurant",
    amount: 2500,
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    chapter_id: "demo-chapter",
    sponsor_name: "Campus Bookstore",
    amount: 1000,
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DemoDashboard = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-white hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                Social Chair Assistant - Demo
              </h1>
              <p className="text-blue-100 text-sm">
                This is a preview of the dashboard with sample data
              </p>
            </div>
          </div>
          <Badge className="bg-yellow-500 text-yellow-900">
            <AlertCircle className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {mockUser.first_name}!
            </h1>
            <p className="mt-1 text-gray-600">
              Here's what's happening with {mockChapter.chapter_code} Chapter
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Badge className={getTierBadgeColor(mockUser.tier)}>
              {getTierIcon(mockUser.tier)}
              {mockUser.tier.charAt(0).toUpperCase() + mockUser.tier.slice(1)}
            </Badge>
            <Badge variant="outline">{mockRole.name}</Badge>
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
                <p className="text-2xl font-bold">{mockEvents.length}</p>
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
                <p className="text-2xl font-bold">{mockSponsorships.length}</p>
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
                  {mockNotifications.filter((n) => !n.is_read).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </DashboardCard>
        </div>

        {/* Interactive Calendar */}
        <DashboardCard
          title="Event Calendar"
          className="mb-6"
          headerAction={
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 mr-2" />
              New Event (Demo)
            </Button>
          }
        >
          <CalendarView
            events={mockEvents}
            className="border-0 p-0"
            eventTypeFilter="all"
          />
        </DashboardCard>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <DashboardCard
            title="Upcoming Events"
            headerAction={
              <Button size="sm" disabled>
                <Plus className="h-4 w-4 mr-2" />
                New Event (Demo)
              </Button>
            }
          >
            <div className="space-y-4">
              {mockEvents.map((event) => (
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
              ))}
            </div>
          </DashboardCard>

          {/* Demo Budget Summary */}
          <DashboardCard title="Budget Summary" maxHeight="max-h-96">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Budget</span>
                <span className="text-lg font-bold">$15,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Spent</span>
                <span className="text-lg font-bold text-red-600">$8,500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Remaining</span>
                <span className="text-lg font-bold text-green-600">$6,500</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "57%" }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                57% of budget used
              </p>
            </div>
          </DashboardCard>

          {/* Demo Notifications */}
          <DashboardCard title="Recent Notifications">
            <div className="space-y-3">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start space-x-3 p-2 bg-blue-50 rounded-lg"
                >
                  <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(notification.created_at),
                        "MMM d, h:mm a",
                      )}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Tier Upgrade Banner */}
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
            <Button className="bg-blue-600 hover:bg-blue-700" disabled>
              Upgrade Now (Demo)
            </Button>
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard title={`Quick Actions for ${mockRole.name}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
              disabled
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="text-sm font-medium">Create Event</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors"
              disabled
            >
              <Users className="h-6 w-6 mb-2 text-green-600" />
              <span className="text-sm font-medium">Guest List</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
              disabled
            >
              <DollarSign className="h-6 w-6 mb-2 text-yellow-600" />
              <span className="text-sm font-medium">Budget</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors"
              disabled
            >
              <CheckCircle className="h-6 w-6 mb-2 text-purple-600" />
              <span className="text-sm font-medium">Tasks</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              disabled
            >
              <Bell className="h-6 w-6 mb-2 text-indigo-600" />
              <span className="text-sm font-medium">Notifications</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center hover:bg-pink-50 hover:border-pink-200 transition-colors"
              disabled
            >
              <TrendingUp className="h-6 w-6 mb-2 text-pink-600" />
              <span className="text-sm font-medium">Analytics</span>
            </Button>
          </div>
        </DashboardCard>

        {/* Call to Action */}
        <DashboardCard className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-green-900 mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-green-700 mb-6">
              Sign up now to create your own chapter dashboard and start
              managing your events!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/login")}
                className="bg-green-600 hover:bg-green-700"
              >
                Sign Up Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default DemoDashboard;
