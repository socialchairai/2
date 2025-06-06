import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardHome from "./dashboard/DashboardHome";

function Home() {
  const { user, chapter, role } = useAuth();

  if (!user || !chapter || !role) {
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
}

export default Home;
