import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "./LoginForm";

export default function Login() {
  const { user, loading } = useAuth();

  // Show loading state while auth is being determined
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

  // Redirect to home if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Social Chair Assistant
          </h1>
          <p className="text-gray-600">
            Manage your chapter's events and activities
          </p>
        </div>
        <LoginForm onSwitchToSignUp={() => {}} />
      </div>
    </div>
  );
}
