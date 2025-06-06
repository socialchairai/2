import { Suspense, useState } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Home from "./components/home";
import AuthScreen from "./components/auth/AuthScreen";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import EventsPage from "./components/events/EventsPage";
import EventsDashboard from "./components/events/EventsDashboard";
import EventForm from "./components/events/EventForm";
import PartyBuilderDashboard from "./components/events/PartyBuilderDashboard";
import EventList from "./components/events/EventList";
import ChapterInvitesPage from "./components/invites/ChapterInvitesPage";
import AcceptInvitePage from "./components/invites/AcceptInvitePage";
import JoinChapterRequestForm from "./components/invites/JoinChapterRequestForm";
import ManageJoinRequestsPage from "./components/invites/ManageJoinRequestsPage";
import BudgetOverview from "./components/budget/BudgetOverview";
import ExpenseLogForm from "./components/budget/ExpenseLogForm";
import ExpensesTable from "./components/budget/ExpensesTable";
import ReviewExpensesPage from "./components/budget/ReviewExpensesPage";
import TasksPage from "./components/tasks/TasksPage";
import DemoDashboard from "./components/dashboard/DemoDashboard";
import routes from "tempo-routes";

function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if user is not authenticated
  if (!loading && !user) {
    return <AuthScreen onAuthComplete={() => {}} />;
  }

  // User is authenticated, show the main app
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<EventsPage />} />
          <Route path="/events" element={<EventsDashboard />} />
          <Route path="/events/create" element={<EventForm />} />
          <Route
            path="/events/dashboard/:eventId"
            element={<PartyBuilderDashboard />}
          />
          <Route path="/events/list" element={<EventList />} />
          <Route path="/invites" element={<ChapterInvitesPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/join-chapter" element={<JoinChapterRequestForm />} />
          <Route path="/manage-requests" element={<ManageJoinRequestsPage />} />
          <Route path="/budget" element={<BudgetOverview />} />
          <Route path="/budget/log-expense" element={<ExpenseLogForm />} />
          <Route path="/budget/expenses" element={<ExpensesTable />} />
          <Route path="/budget/review" element={<ReviewExpensesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/demo-dashboard" element={<DemoDashboard />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
