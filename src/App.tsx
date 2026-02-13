import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import CustomerDetail from "@/pages/CustomerDetail";
import BillPage from "@/pages/BillPage";
import SaleBillPage from "@/pages/SaleBillPage";
import TransactionHistory from "@/pages/TransactionHistory";
import Reports from "@/pages/Reports";
import GSTReports from "@/pages/GSTReports";
import Reminders from "@/pages/Reminders";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 w-full overflow-x-hidden">
        <div className="w-full max-w-[100vw] lg:max-w-none mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customer/:id" element={<CustomerDetail />} />
            <Route path="/bill/:id" element={<BillPage />} />
            <Route path="/bill/sale/:id" element={<SaleBillPage />} />
            <Route path="/history" element={<TransactionHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/gst" element={<GSTReports />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="kb-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
