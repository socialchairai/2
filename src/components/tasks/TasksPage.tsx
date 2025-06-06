import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskList from "./TaskList";

const TasksPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <TaskList />
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
