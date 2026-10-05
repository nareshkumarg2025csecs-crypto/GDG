import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import AdminGatewayPage from "./pages/admin/AdminGatewayPage";
import { AdminCertificatesPage } from "./pages/admin/AdminCertificatesPage";
import StudentDashboardPage from "./pages/dashboard/StudentDashboardPage";
import PersonalInfoPage from "./pages/auth/PersonalInfoPage";
import AdminOnboardPage from "./pages/admin/AdminOnboardPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { useLenis } from "@/lib/scroll";

const OAuthRedirectInterceptor = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If Supabase redirected to the site root with auth tokens or errors in the URL hash
    if (
      window.location.hash &&
      (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))
    ) {
      if (location.pathname !== '/auth/callback') {
        const storedRole = sessionStorage.getItem('oauth_role');
        const search = window.location.search || '';
        let roleParam = '';
        if (!search.includes('role=') && storedRole === 'admin') {
          roleParam = search ? '&role=admin' : '?role=admin';
        }
        navigate(`/auth/callback${search}${roleParam}${window.location.hash}`, { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
};

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
              <OAuthRedirectInterceptor />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/events/:id/form" element={<EventRegistrationPage />} />
                <Route path="/events/:id/register" element={<EventRegistrationPage />} />
                
                {/* Student / User Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <StudentDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <StudentDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <PersonalInfoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complete-profile"
                  element={
                    <ProtectedRoute>
                      <PersonalInfoPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin-only Routes */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route
                  path="/admin/onboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminOnboardPage />
                    </ProtectedRoute>
                  }
                />
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
                <Route
                  path="/admin/certificates"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCertificatesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Secret Admin Gateway Route */}
                <Route path="/admin-gdg" element={<AdminGatewayPage />} />

                {/* Auth Routes */}
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<AuthPage defaultMode="login" />} />
                <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
                <Route path="/auth/login" element={<AuthPage defaultMode="login" />} />
                <Route path="/auth/signup" element={<AuthPage defaultMode="signup" />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
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

