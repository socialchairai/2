import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Building,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";

// Mock data
const mockEvents = [
  {
    id: "1",
    title: "Spring Formal",
    date: "2024-04-15",
    time: "19:00",
    location: "Grand Ballroom, Downtown Hotel",
    status: "approved" as const,
  },
  {
    id: "2",
    title: "Mixer with Delta Gamma",
    date: "2024-04-08",
    time: "20:00",
    location: "Chapter House",
    status: "pending" as const,
  },
  {
    id: "3",
    title: "Philanthropy Event",
    date: "2024-04-22",
    time: "14:00",
    location: "Campus Quad",
    status: "approved" as const,
  },
  {
    id: "4",
    title: "Rush Week Kickoff",
    date: "2024-05-01",
    time: "18:00",
    location: "Student Union",
    status: "pending" as const,
  },
];

const mockBudget = {
  total: 15000,
  spent: 8750,
  remaining: 6250,
};

const mockApprovals = [
  {
    id: "1",
    title: "Venue Booking - Grand Ballroom",
    type: "Venue Approval",
    status: "pending" as const,
    dueDate: "2024-04-05",
  },
  {
    id: "2",
    title: "Catering Expense - $2,400",
    type: "Expense Submission",
    status: "approved" as const,
    dueDate: "2024-04-03",
  },
  {
    id: "3",
    title: "DJ Equipment Rental",
    type: "Vendor Approval",
    status: "rejected" as const,
    dueDate: "2024-04-02",
  },
];

const Dashboard: React.FC = () => {
  const { user, chapter, role } = useAuth();
  const { toast } = useToast();

  const isSocialChair = role?.name === "Social Chair";
  const isReadOnly = !isSocialChair;
  const budgetPercentage = (mockBudget.spent / mockBudget.total) * 100;
  const isOverBudget = budgetPercentage > 100;

  const handleCreateEvent = () => {
    if (isReadOnly) {
      toast({
        title: "Access Restricted",
        description: "You can only view this information.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Create Event",
      description: "Redirecting to event creation form...",
    });
  };

  const getStatusBadge = (status: "approved" | "pending" | "rejected") => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  if (!user || !chapter || !role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome, {user.first_name} {user.last_name}
                </h1>
                {isReadOnly && (
                  <Badge variant="outline" className="bg-gray-50">
                    <Eye className="h-3 w-3 mr-1" />
                    View Only
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{chapter.chapter_code} Chapter</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{chapter.fraternity_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{chapter.school_name}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Badge variant="outline" className="text-sm">
                {role.name}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <DashboardCard
            title="Upcoming Events"
            className="lg:col-span-2 xl:col-span-2"
            headerAction={
              <Button
                size="sm"
                onClick={handleCreateEvent}
                disabled={isReadOnly}
                className={isReadOnly ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            }
          >
            <div className="space-y-4">
              {mockEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {event.title}
                    </h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {format(new Date(event.date), "MMM d")} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(event.status)}
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Budget Snapshot */}
          <DashboardCard title="Budget Overview">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${mockBudget.total.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${mockBudget.spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p
                    className={`text-lg font-bold ${
                      isOverBudget ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ${mockBudget.remaining.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Budget Usage</span>
                  <span
                    className={`font-medium ${
                      isOverBudget ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {budgetPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(budgetPercentage, 100)}
                  className={`h-3 ${isOverBudget ? "bg-red-100" : ""}`}
                />
                {isOverBudget && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Over Budget Warning!</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isReadOnly}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Full Budget
                </Button>
              </div>
            </div>
          </DashboardCard>

          {/* Pending Approvals */}
          <DashboardCard
            title="Pending Approvals"
            className="lg:col-span-2 xl:col-span-3"
          >
            <div className="space-y-3">
              {mockApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {approval.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{approval.type}</span>
                      <span>
                        Due: {format(new Date(approval.dueDate), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(approval.status)}
                    {!isReadOnly && approval.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {mockApprovals.filter((a) => a.status === "pending").length ===
              0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All approvals are up to date!</p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard>
            <div className="text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {mockEvents.length}
              </p>
              <p className="text-sm text-gray-600">Upcoming Events</p>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                ${mockBudget.remaining.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Budget Remaining</p>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {mockApprovals.filter((a) => a.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pending Approvals</p>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">42</p>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
