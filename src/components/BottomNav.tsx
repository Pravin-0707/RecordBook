import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BarChart3, History, Receipt, Menu, Settings, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/history", icon: History, label: "History" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/gst", icon: Receipt, label: "GST" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            RecordBook
          </SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 py-6">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                variant={active ? "default" : "ghost"}
                className="justify-start gap-3 h-12 text-base"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BottomNav;
