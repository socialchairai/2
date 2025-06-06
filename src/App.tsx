import { Suspense, useState, useEffect } from "react";
import { useRoutes, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";
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
  const [showAuthFallback, setShowAuthFallback] = useState(false);
  const navigate = useNavigate();

  // Handle authentication state changes and redirect to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session && user) {
        console.log("User is authenticated, redirecting to dashboard");
        navigate("/dashboard");
      }
    };

    // Check session on mount
    if (user && !loading) {
      checkSession();
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("App: Auth state changed:", event, !!session);
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, redirecting to dashboard");
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loading, navigate]);

  // Add a fallback mechanism if loading takes too long
  useEffect(() => {
    if (loading) {
      const fallbackTimer = setTimeout(() => {
        console.warn("Loading took too long, showing auth screen");
        setShowAuthFallback(true);
      }, 1500); // Reduced to 1.5 seconds

      return () => clearTimeout(fallbackTimer);
    } else {
      setShowAuthFallback(false);
    }
  }, [loading]);

  // Show auth screen if user is not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  // Show minimal loading only for very brief moments
  if (loading && !showAuthFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
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
