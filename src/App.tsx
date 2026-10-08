import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EasterEggProvider } from "@/components/easter-eggs/EasterEggProvider";
import CustomCursor from "@/components/CustomCursor";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { useLenis } from "@/lib/scroll";
import { TOOLS_CONFIG } from "@/config/toolsConfig";

const Index = lazy(() => import("./pages/Index"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/events/EventDetailPage"));
const EventRegistrationPage = lazy(() => import("./pages/events/EventRegistrationPage"));
const AdminEventsPage = lazy(() => import("./pages/admin/AdminEventsPage"));
const AdminEventEditorPage = lazy(() => import("./pages/admin/AdminEventEditorPage"));
const AdminSubmissionsPage = lazy(() => import("./pages/admin/AdminSubmissionsPage"));
const AdminGatewayPage = lazy(() => import("./pages/admin/AdminGatewayPage"));
const AdminCertificatesPage = lazy(() => import("./pages/admin/AdminCertificatesPage").then(m => ({ default: m.AdminCertificatesPage })));
const StudentDashboardPage = lazy(() => import("./pages/dashboard/StudentDashboardPage"));
const PersonalInfoPage = lazy(() => import("./pages/auth/PersonalInfoPage"));
const AdminOnboardPage = lazy(() => import("./pages/admin/AdminOnboardPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

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
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-xl focus:shadow-2xl focus:border focus:border-border focus:ring-2 focus:ring-google-blue font-sans text-xs font-bold"
              >
                Skip to main content
              </a>
              <ScrollToTop />
              <OAuthRedirectInterceptor />
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/about-us" element={<AboutUsPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route
                    path="/tools"
                    element={
                      TOOLS_CONFIG.ENABLED ? (
                        <ToolsPage />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
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
              </Suspense>
            </BrowserRouter>
          </div>
        </EasterEggProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;

