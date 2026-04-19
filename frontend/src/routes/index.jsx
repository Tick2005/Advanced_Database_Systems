import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import DashLayout from "../layouts/DashLayout";
import { PATHS } from "./pathConstants";
import Home from "../pages/Home";
import Branches from "../pages/Branches";
import NotFound from "../pages/NotFound";
import Forbidden from "../pages/errors/Forbidden";
import Signin from "../features/auth/pages/Signin";
import Signup from "../features/auth/pages/Signup";
import { ForgotPasswordPage, ResetPasswordPage } from "../features/auth/pages/ForgotResetPassword";
import RoomList from "../features/rooms/pages/RoomList";
import RoomDetail from "../features/rooms/pages/RoomDetail";
import PreviewBooking from "../features/booking/pages/PreviewBooking";
import VnPayPayment from "../features/booking/pages/VnPayPayment";
import ReviewBooking from "../features/booking/pages/ReviewBooking";
import VnPayReturn from "../features/booking/pages/VnPayReturn";
import PaymentSuccessPage from "../features/booking/pages/PaymentSuccessPage";
import PaymentFailedPage from "../features/booking/pages/PaymentFailedPage";
import BookingsPage from "../features/booking/pages/BookingsPage";
import BookingDetailPage from "../features/booking/pages/BookingDetailPage";
import Feedbacks from "../features/feedback/pages/Feedbacks";
import CreateFeedback from "../features/feedback/pages/CreateFeedback";
import Profile from "../features/users/pages/Profile";
import Settings from "../features/users/pages/Settings";
import ProfileEdit from "../features/users/pages/ProfileEdit";
import SecuritySettings from "../features/users/pages/SecuritySettings";
import StaffHomePage from "../features/staff/pages/StaffHomePage";
import StaffBookingsTodayPage from "../features/staff/pages/StaffBookingsTodayPage";
import StaffCheckinPage from "../features/staff/pages/StaffCheckinPage";
import StaffCheckoutPage from "../features/staff/pages/StaffCheckoutPage";
import StaffRoomStatusPage from "../features/staff/pages/StaffRoomStatusPage";
import StaffServiceUsagePage from "../features/staff/pages/StaffServiceUsagePage";
import ManagerHomePage from "../features/manager/pages/ManagerHomePage";
import ManagerRoomsPage from "../features/manager/pages/ManagerRoomsPage";
import ManagerRoomCreatePage from "../features/manager/pages/ManagerRoomCreatePage";
import ManagerRoomEditPage from "../features/manager/pages/ManagerRoomEditPage";
import ManagerBookingsPage from "../features/manager/pages/ManagerBookingsPage";
import ManagerBookingDetailPage from "../features/manager/pages/ManagerBookingDetailPage";
import ManagerFeedbacksPage from "../features/manager/pages/ManagerFeedbacksPage";
import ManagerServicesPage from "../features/manager/pages/ManagerServicesPage";
import ManagerPricingRequestsPage from "../features/manager/pages/ManagerPricingRequestsPage";
import ManagerRevenueReportPage from "../features/manager/pages/ManagerRevenueReportPage";
import ManagerBookingReportPage from "../features/manager/pages/ManagerBookingReportPage";
import OwnerHomePage from "../features/owner/pages/OwnerHomePage";
import OwnerBranchesPage from "../features/owner/pages/OwnerBranchesPage";
import OwnerPricingPage from "../features/owner/pages/OwnerPricingPage";
import OwnerPricingRequestsPage from "../features/owner/pages/OwnerPricingRequestsPage";
import OwnerUsersPage from "../features/owner/pages/OwnerUsersPage";
import OwnerRevenueReportPage from "../features/owner/pages/OwnerRevenueReportPage";
import OwnerBranchCompareReportPage from "../features/owner/pages/OwnerBranchCompareReportPage";
import OwnerLogsPage from "../features/owner/pages/OwnerLogsPage";
import AuthGuard from "./guards/AuthGuard";
import RoleGuard from "./guards/RoleGuard";
import { useAuth } from "../features/auth/useAuth";

function defaultRedirectByRole(role) {
  if (role === "CUSTOMER") return PATHS.CUSTOMER_HOME;
  if (role === "STAFF") return PATHS.STAFF;
  if (role === "MANAGER") return PATHS.MANAGER;
  if (role === "OWNER") return PATHS.OWNER;
  return PATHS.HOME;
}

function GuestOnlyRoute({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={defaultRedirectByRole(role)} replace />;
  }
  return children;
}

function CustomerGuard({ children }) {
  return (
    <AuthGuard>
      <RoleGuard roles={["CUSTOMER"]}>{children}</RoleGuard>
    </AuthGuard>
  );
}

function RoleShell({ roles }) {
  return (
    <AuthGuard>
      <RoleGuard roles={roles}>
        <DashLayout />
      </RoleGuard>
    </AuthGuard>
  );
}

function PublicShell() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path={PATHS.HOME} element={<Home />} />
        <Route path={PATHS.ROOMS} element={<RoomList />} />
        <Route path={PATHS.ROOM_DETAIL} element={<RoomDetail />} />
        <Route path={PATHS.BRANCHES} element={<Branches />} />
        <Route path={PATHS.LOGIN} element={<GuestOnlyRoute><Signin /></GuestOnlyRoute>} />
        <Route path={PATHS.REGISTER} element={<GuestOnlyRoute><Signup /></GuestOnlyRoute>} />
        <Route path={PATHS.FORGOT_PASSWORD} element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
        <Route path={PATHS.RESET_PASSWORD} element={<GuestOnlyRoute><ResetPasswordPage /></GuestOnlyRoute>} />

        <Route path={PATHS.CUSTOMER_HOME} element={<CustomerGuard><Home /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_ROOMS} element={<CustomerGuard><RoomList customer /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_ROOM_DETAIL} element={<CustomerGuard><RoomDetail customer /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKING_CREATE} element={<CustomerGuard><PreviewBooking /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKING_REVIEW} element={<CustomerGuard><ReviewBooking /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKING_PAYMENT} element={<CustomerGuard><VnPayPayment /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKING_RESULT} element={<VnPayReturn />} />
        <Route path={PATHS.CUSTOMER_BOOKING_SUCCESS} element={<CustomerGuard><PaymentSuccessPage /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKING_FAILED} element={<CustomerGuard><PaymentFailedPage /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKINGS} element={<CustomerGuard><BookingsPage /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_BOOKING_DETAIL} element={<CustomerGuard><BookingDetailPage /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_FEEDBACKS} element={<CustomerGuard><Feedbacks /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_FEEDBACK_CREATE} element={<CustomerGuard><CreateFeedback /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_PROFILE} element={<CustomerGuard><Profile /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_PROFILE_EDIT} element={<CustomerGuard><ProfileEdit /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_SETTINGS} element={<CustomerGuard><Settings /></CustomerGuard>} />
        <Route path={PATHS.CUSTOMER_SETTINGS_ADVANCED} element={<CustomerGuard><SecuritySettings /></CustomerGuard>} />
      </Route>

      <Route path={PATHS.STAFF} element={<RoleShell roles={["STAFF"]} />}>
        <Route index element={<StaffHomePage />} />
        <Route path="bookings/today" element={<StaffBookingsTodayPage />} />
        <Route path="checkin/:id" element={<StaffCheckinPage />} />
        <Route path="checkout/:id" element={<StaffCheckoutPage />} />
        <Route path="rooms/status" element={<StaffRoomStatusPage />} />
        <Route path="service-usage" element={<StaffServiceUsagePage />} />
      </Route>

      <Route path={PATHS.MANAGER} element={<RoleShell roles={["MANAGER"]} />}>
        <Route index element={<ManagerHomePage />} />
        <Route path="rooms" element={<ManagerRoomsPage />} />
        <Route path="rooms/create" element={<ManagerRoomCreatePage />} />
        <Route path="rooms/:id/edit" element={<ManagerRoomEditPage />} />
        <Route path="bookings" element={<ManagerBookingsPage />} />
        <Route path="bookings/:id" element={<ManagerBookingDetailPage />} />
        <Route path="feedbacks" element={<ManagerFeedbacksPage />} />
        <Route path="services" element={<ManagerServicesPage />} />
        <Route path="pricing-requests" element={<ManagerPricingRequestsPage />} />
        <Route path="reports/revenue" element={<ManagerRevenueReportPage />} />
        <Route path="reports/booking" element={<ManagerBookingReportPage />} />
      </Route>

      <Route path={PATHS.OWNER} element={<RoleShell roles={["OWNER"]} />}>
        <Route index element={<OwnerHomePage />} />
        <Route path="branches" element={<OwnerBranchesPage />} />
        <Route path="pricing" element={<OwnerPricingPage />} />
        <Route path="pricing-requests" element={<OwnerPricingRequestsPage />} />
        <Route path="users" element={<OwnerUsersPage />} />
        <Route path="reports/revenue" element={<OwnerRevenueReportPage />} />
        <Route path="reports/branches" element={<OwnerBranchCompareReportPage />} />
        <Route path="logs" element={<OwnerLogsPage />} />
      </Route>

      <Route path={PATHS.FORBIDDEN} element={<Forbidden />} />
      <Route path="/signin" element={<Navigate to={PATHS.LOGIN} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
