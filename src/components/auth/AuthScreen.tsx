import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import OnboardingScreen from "./OnboardingScreen";

interface AuthScreenProps {
  onAuthComplete: () => void;
}

export default function AuthScreen({ onAuthComplete }: AuthScreenProps) {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for new users (you can customize this logic)
  React.useEffect(() => {
    if (user) {
      // Check if this is a new user (you might want to add a flag to track this)
      const isNewUser = !user.last_login;
      if (isNewUser && !showOnboarding) {
        setShowOnboarding(true);
      } else if (!isNewUser) {
        onAuthComplete();
      }
    }
  }, [user, showOnboarding, onAuthComplete]);

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

  if (user && showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setShowOnboarding(false);
          onAuthComplete();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
