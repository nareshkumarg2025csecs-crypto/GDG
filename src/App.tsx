import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EasterEggProvider } from "@/components/easter-eggs/EasterEggProvider";
import CustomCursor from "@/components/CustomCursor";
import Index from "./pages/Index";
import TeamPage from "./pages/TeamPage";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import EventsPage from "./pages/events/EventsPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import EventRegistrationPage from "./pages/events/EventRegistrationPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminEventEditorPage from "./pages/admin/AdminEventEditorPage";
import AdminSubmissionsPage from "./pages/admin/AdminSubmissionsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { useLenis } from "@/lib/scroll";

const queryClient = new QueryClient();

const App = () => {
  useLenis();
  
  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <EasterEggProvider>
          <CustomCursor />
          <div data-no-leet>
            <Toaster />
            <Sonner />
          </div>
          <div data-easter-content className="contents">
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/events/:id/form" element={<EventRegistrationPage />} />
                
                {/* Admin-only Routes */}
                <Route
                  path="/admin/events"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEventsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/new"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEventEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEventEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/forms/:formId/submissions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSubmissionsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Auth Routes */}
                <Route path="/login" element={<AuthPage defaultMode="login" />} />
                <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
                <Route path="/auth/login" element={<AuthPage defaultMode="login" />} />
                <Route path="/auth/signup" element={<AuthPage defaultMode="signup" />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </EasterEggProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;

