import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import { Navigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.role === "teacher") {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;
