import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import { useNavigate } from "react-router-dom";

export default function AuthScreen() {
  const { user } = useAuth();
  const [view, setView] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  // Redirect to dashboard when user is authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // If user is authenticated, don't render anything (redirect will happen)
  if (user) {
    return null;
  }

  // Always show auth forms - no loading screens
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {view === "login" ? (
          <LoginForm onSwitchToSignUp={() => setView("signup")} />
        ) : (
          <SignUpForm onSwitchToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
}
