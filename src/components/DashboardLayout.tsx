import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Settings, 
  LogOut,
  Users,
  FileText,
  Key
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const teacherNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
    { icon: Users, label: "Students", path: "/dashboard/students" },
    { icon: FileText, label: "Syllabus", path: "/dashboard/syllabus" },
    { icon: Key, label: "Access Codes", path: "/dashboard/codes" },
  ];

  const studentNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Upload, label: "Upload", path: "/dashboard/upload" },
    { icon: BarChart3, label: "My Progress", path: "/dashboard/progress" },
  ];

  const navItems = user?.role === "teacher" ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-display font-bold">EduAnalytics</span>
              <p className="text-xs text-muted-foreground capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
