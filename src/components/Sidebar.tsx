import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BarChart3, Settings, History, Receipt, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/history", icon: History, label: "History" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/gst", icon: Receipt, label: "GST Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-card border-r h-screen sticky top-0">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-primary">RecordBook</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              variant={active ? "default" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button onClick={logout} variant="outline" className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
