import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import DashLayout from "../layouts/DashLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import { PATHS } from "./pathConstants";
import AuthGuard from "./guards/AuthGuard";
import RoleGuard from "./guards/RoleGuard";
import { useAuth } from "../features/auth/useAuth";

const Home = lazy(() => import("../pages/Home"));
const Branches = lazy(() => import("../pages/Branches"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Forbidden = lazy(() => import("../pages/errors/Forbidden"));
const Signin = lazy(() => import("../features/auth/pages/Signin"));
const Signup = lazy(() => import("../features/auth/pages/Signup"));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotResetPassword").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("../features/auth/pages/ForgotResetPassword").then((module) => ({ default: module.ResetPasswordPage })));
const VerifyEmail = lazy(() => import("../features/auth/pages/VerifyEmail"));
const RoomList = lazy(() => import("../features/rooms/pages/RoomList"));
const RoomDetail = lazy(() => import("../features/rooms/pages/RoomDetail"));
// PreviewBooking — step 1 of booking flow, navigated to from RoomDetail with state
const PreviewBooking = lazy(() => import("../features/booking/pages/PreviewBooking"));
const ReviewBooking = lazy(() => import("../features/booking/pages/ReviewBooking"));
const VnPayReturn = lazy(() => import("../features/booking/pages/VnPayReturn"));
const PaymentSuccessPage = lazy(() => import("../features/booking/pages/PaymentSuccessPage"));
const PaymentFailedPage = lazy(() => import("../features/booking/pages/PaymentFailedPage"));
const BookingsPage = lazy(() => import("../features/booking/pages/BookingsPage"));
const BookingDetailPage = lazy(() => import("../features/booking/pages/BookingDetailPage"));
const CreateFeedback = lazy(() => import("../features/feedback/pages/CreateFeedback"));
const Profile = lazy(() => import("../features/users/pages/Profile"));
const Settings = lazy(() => import("../features/users/pages/Settings"));
const SecuritySettings = lazy(() => import("../features/users/pages/SecuritySettings"));
const StaffHomePage = lazy(() => import("../features/staff/pages/StaffHomePage"));
const StaffBookingsTodayPage = lazy(() => import("../features/staff/pages/StaffBookingsTodayPage"));
const StaffCheckinPage = lazy(() => import("../features/staff/pages/StaffCheckinPage"));
const StaffCheckoutPage = lazy(() => import("../features/staff/pages/StaffCheckoutPage"));
const StaffRoomStatusPage = lazy(() => import("../features/staff/pages/StaffRoomStatusPage"));
// StaffServiceUsagePage removed — merged into StaffBookingsTodayPage
const ManagerHomePage = lazy(() => import("../features/manager/pages/ManagerHomePage"));
const ManagerRoomsPage = lazy(() => import("../features/manager/pages/ManagerRoomsPage"));
const ManagerRoomCreatePage = lazy(() => import("../features/manager/pages/ManagerRoomCreatePage"));
const ManagerRoomEditPage = lazy(() => import("../features/manager/pages/ManagerRoomEditPage"));
const ManagerBookingsPage = lazy(() => import("../features/manager/pages/ManagerBookingsPage"));
const ManagerBookingDetailPage = lazy(() => import("../features/manager/pages/ManagerBookingDetailPage"));
const ManagerStaffPage = lazy(() => import("../features/manager/pages/ManagerStaffPage"));
const ManagerFeedbacksPage = lazy(() => import("../features/manager/pages/ManagerFeedbacksPage"));
const ManagerServicesPage = lazy(() => import("../features/manager/pages/ManagerServicesPage"));
const ManagerPricingRequestsPage = lazy(() => import("../features/manager/pages/ManagerPricingRequestsPage"));
const OwnerHomePage = lazy(() => import("../features/owner/pages/OwnerHomePage"));
const OwnerBookingsPage = lazy(() => import("../features/owner/pages/OwnerBookingsPage"));
const OwnerBranchesPage = lazy(() => import("../features/owner/pages/OwnerBranchesPage"));
const OwnerPricingPage = lazy(() => import("../features/owner/pages/OwnerPricingPage"));
const OwnerPricingRequestsPage = lazy(() => import("../features/owner/pages/OwnerPricingRequestsPage"));
const OwnerRoomTypesPage = lazy(() => import("../features/owner/pages/OwnerRoomTypesPage"));
const OwnerUsersPage = lazy(() => import("../features/owner/pages/OwnerUsersPage"));

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
    <Suspense fallback={<section className="container" style={{ padding: "28px 24px" }}>Dang tai trang...</section>}>
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
            <Route path={PATHS.VERIFY_EMAIL} element={<VerifyEmail />} />
          <Route path={PATHS.CUSTOMER_BOOKING_RESULT} element={<VnPayReturn />} />
          <Route path="/payment/vnpay-return" element={<VnPayReturn />} />
          <Route path={PATHS.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
          <Route path={PATHS.PAYMENT_FAILED} element={<PaymentFailedPage />} />
          <Route path={PATHS.CUSTOMER_BOOKING_SUCCESS} element={<PaymentSuccessPage />} />
          <Route path={PATHS.CUSTOMER_BOOKING_FAILED} element={<PaymentFailedPage />} />
        </Route>

        <Route element={<CustomerLayout />}>
          <Route path={PATHS.CUSTOMER_HOME} element={<Home />} />
          <Route path={PATHS.CUSTOMER_ROOMS} element={<RoomList customer />} />
          <Route path={PATHS.CUSTOMER_ROOM_DETAIL} element={<RoomDetail customer />} />
          {/* booking/create — step 1 of booking flow from RoomDetail; redirects to rooms if accessed directly without state */}
          <Route path={PATHS.CUSTOMER_BOOKING_CREATE} element={<PreviewBooking />} />
          <Route path={PATHS.CUSTOMER_BOOKING_REVIEW} element={<ReviewBooking />} />
          <Route path={PATHS.CUSTOMER_BOOKINGS} element={<BookingsPage />} />
          <Route path={PATHS.CUSTOMER_BOOKING_DETAIL} element={<BookingDetailPage />} />
          <Route path={PATHS.CUSTOMER_FEEDBACK_CREATE} element={<CreateFeedback />} />
          <Route path="/customer/feedbacks/create" element={<Navigate to={PATHS.CUSTOMER_FEEDBACK_CREATE} replace />} />
          <Route path={PATHS.CUSTOMER_PROFILE} element={<Profile />} />
          <Route path={PATHS.CUSTOMER_SETTINGS} element={<Settings />} />
          <Route path={PATHS.CUSTOMER_SETTINGS_ADVANCED} element={<SecuritySettings />} />
        </Route>

        <Route path={PATHS.STAFF} element={<RoleShell roles={["STAFF"]} />}>
          <Route index element={<StaffHomePage />} />
          <Route path="bookings/today" element={<StaffBookingsTodayPage />} />
          <Route path="checkin/:id" element={<StaffCheckinPage />} />
          <Route path="checkout/:id" element={<StaffCheckoutPage />} />
          <Route path="rooms/status" element={<StaffRoomStatusPage />} />
          <Route path="service-usage" element={<Navigate to={PATHS.STAFF_BOOKINGS_TODAY} replace />} />
        </Route>

        <Route path={PATHS.MANAGER} element={<RoleShell roles={["MANAGER"]} />}>
          <Route index element={<ManagerHomePage />} />
          <Route path="rooms" element={<ManagerRoomsPage />} />
          <Route path="rooms/create" element={<ManagerRoomCreatePage />} />
          <Route path="rooms/:id/edit" element={<ManagerRoomEditPage />} />
          <Route path="bookings" element={<ManagerBookingsPage />} />
          <Route path="bookings/:id" element={<ManagerBookingDetailPage />} />
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="feedbacks" element={<ManagerFeedbacksPage />} />
          <Route path="services" element={<ManagerServicesPage />} />
          <Route path="pricing-requests" element={<ManagerPricingRequestsPage />} />
        </Route>

        <Route path={PATHS.OWNER} element={<RoleShell roles={["OWNER"]} />}>
          <Route index element={<OwnerHomePage />} />
          <Route path="bookings" element={<OwnerBookingsPage />} />
          <Route path="branches" element={<OwnerBranchesPage />} />
          <Route path="pricing" element={<OwnerPricingPage />} />
          <Route path="pricing-requests" element={<OwnerPricingRequestsPage />} />
          <Route path="room-types" element={<OwnerRoomTypesPage />} />
          <Route path="users" element={<OwnerUsersPage />} />
        </Route>

        <Route path={PATHS.FORBIDDEN} element={<Forbidden />} />
        <Route path="/signin" element={<Navigate to={PATHS.LOGIN} replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
