import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/subscription/Success";
import Welcome from "./pages/onboarding/Welcome";
import OrganizationSetup from "./pages/onboarding/OrganizationSetup";
import SubscriptionSetup from "./pages/onboarding/SubscriptionSetup";
import SetupComplete from "./pages/onboarding/SetupComplete";
import AddAccount from "./pages/AddAccount";
import ProfileDetails from "./pages/ProfileDetails";
import Settings from "./pages/Settings";
import AccountPage from "./pages/AccountPage";
import CostManagement from "./pages/CostManagement";
import CloudHealth from "./pages/CloudHealth";
import CloudOps from "./pages/CloudOps";
import Resources from "./pages/Resources";
// Reservations page removed - use CostManagement with tab=reservations instead
import ResourceDetails from "./pages/ResourceDetails";
import Architecture from "./pages/Architecture";
import OptimizationLab from "./pages/OptimizationLab";
import Schedules from "./pages/Schedules";
import CreateSchedule from "./pages/CreateSchedule";
import ScheduleDetail from "./pages/ScheduleDetail";
import AuditLogs from "./pages/AuditLogs";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import SupabaseProtectedRoute from "./components/SupabaseProtectedRoute";
import { ApiErrorBoundary } from "./components/ApiErrorBoundary";
import { errorLogger } from "./lib/error-logging";
import ErrorHandlingDemo from "./pages/ErrorHandlingDemo";
import OptimisticUIDemo from "./pages/OptimisticUIDemo";
import Billing from "./pages/Billing";
import { OnboardingProvider } from "./hooks/use-onboarding";

// Route-specific error boundary wrapper
const RouteErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  return (
    <ApiErrorBoundary
      maxRetries={3}
      onError={(error, errorInfo) => {
        errorLogger.logErrorBoundary(error, errorInfo, { 
          location: location.pathname,
          source: 'route-error-boundary'
        });
      }}
    >
      {children}
    </ApiErrorBoundary>
  );
};

const App = () => (
  <TooltipProvider>
    <ApiErrorBoundary
      onError={(error, errorInfo) => {
        errorLogger.logErrorBoundary(error, errorInfo, { source: 'app-error-boundary' });
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RouteErrorBoundary><LandingPage /></RouteErrorBoundary>} />
        <Route path="/login" element={<RouteErrorBoundary><Login /></RouteErrorBoundary>} />
        <Route path="/reset-password" element={<RouteErrorBoundary><ResetPassword /></RouteErrorBoundary>} />
        <Route path="/pricing" element={<RouteErrorBoundary><Pricing /></RouteErrorBoundary>} />
        <Route path="/subscription/success" element={<RouteErrorBoundary><SubscriptionSuccess /></RouteErrorBoundary>} />

        {/* Onboarding routes - protected but with onboarding provider */}
        <Route element={<SupabaseProtectedRoute />}>
          <Route path="/onboarding/*" element={
            <OnboardingProvider>
              <Routes>
                <Route path="/welcome" element={<RouteErrorBoundary><Welcome /></RouteErrorBoundary>} />
                <Route path="/organization" element={<RouteErrorBoundary><OrganizationSetup /></RouteErrorBoundary>} />
                <Route path="/subscription" element={<RouteErrorBoundary><SubscriptionSetup /></RouteErrorBoundary>} />
                <Route path="/complete" element={<RouteErrorBoundary><SetupComplete /></RouteErrorBoundary>} />
              </Routes>
            </OnboardingProvider>
          } />
        </Route>

        {/* Protected routes with Supabase */}
        <Route element={<SupabaseProtectedRoute />}>
          <Route path="/dashboard" element={<RouteErrorBoundary><Index /></RouteErrorBoundary>} />
          <Route path="/user-profile" element={<RouteErrorBoundary><UserProfile /></RouteErrorBoundary>} />
          <Route path="/add-account" element={<RouteErrorBoundary><AddAccount /></RouteErrorBoundary>} />
          <Route path="/profile" element={<RouteErrorBoundary><ProfileDetails /></RouteErrorBoundary>} />
          <Route path="/settings" element={<RouteErrorBoundary><Settings /></RouteErrorBoundary>} />
          <Route path="/account" element={<RouteErrorBoundary><AccountPage /></RouteErrorBoundary>} />
          <Route path="/costmanagement" element={<RouteErrorBoundary><CostManagement /></RouteErrorBoundary>} />
          <Route path="/cloud-health" element={<Navigate to="/cloud-ops?tab=cloud-health" replace />} />
          <Route path="/cloud-ops" element={<RouteErrorBoundary><CloudOps /></RouteErrorBoundary>} />
          <Route path="/resources" element={<RouteErrorBoundary><Resources /></RouteErrorBoundary>} />
          <Route path="/resources/discovery" element={<Navigate to="/resources?tab=discovery" replace />} />
          <Route path="/resource-details" element={<RouteErrorBoundary><ResourceDetails /></RouteErrorBoundary>} />
          <Route path="/architecture" element={<RouteErrorBoundary><Architecture /></RouteErrorBoundary>} />
          <Route path="/reservations" element={<Navigate to="/costmanagement?tab=reservations" replace />} />
          <Route path="/optimization-lab" element={<Navigate to="/costmanagement?tab=optimization-lab" replace />} />
          <Route path="/schedules" element={<Navigate to="/cloud-ops?tab=schedules" replace />} />
          <Route path="/schedules/:id" element={<RouteErrorBoundary><ScheduleDetail /></RouteErrorBoundary>} />
          <Route path="/create-schedule" element={<RouteErrorBoundary><CreateSchedule /></RouteErrorBoundary>} />
          <Route path="/onboarding" element={<RouteErrorBoundary><Onboarding /></RouteErrorBoundary>} />
          <Route path="/cloud-accounts" element={<Navigate to="/onboarding" replace />} />
          <Route path="/teams" element={<Navigate to="/onboarding" replace />} />
          <Route path="/tags" element={<Navigate to="/resources?tab=tags" replace />} />
          <Route path="/users" element={<Navigate to="/onboarding?tab=users" replace />} />
          <Route path="/audit-logs" element={<Navigate to="/cloud-ops?tab=audit-logs" replace />} />
          <Route path="/billing" element={<RouteErrorBoundary><Billing /></RouteErrorBoundary>} />
          <Route path="/error-handling-demo" element={<RouteErrorBoundary><ErrorHandlingDemo /></RouteErrorBoundary>} />
          <Route path="/optimistic-ui-demo" element={<RouteErrorBoundary><OptimisticUIDemo /></RouteErrorBoundary>} />
        </Route>

        {/* Legacy routes for backward compatibility */}
        <Route path="/sign-in" element={<Navigate to="/login" replace />} />
        <Route path="/sign-up" element={<Navigate to="/login" replace />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </ApiErrorBoundary>
  </TooltipProvider>
);

export default App;