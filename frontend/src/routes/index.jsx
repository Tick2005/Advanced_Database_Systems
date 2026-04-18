import React from 'react';
import { Navigate } from 'react-router-dom';
import PATHS from './pathConstants';
import AuthGuard from './guards/AuthGuard';
import GuestGuard from './guards/GuestGuard';
import RoleGuard from './guards/RoleGuard';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import StaffLayout from '../layouts/StaffLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import OwnerLayout from '../layouts/OwnerLayout';

// Public pages
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import RoomList from '../pages/public/RoomList';
import RoomDetail from '../pages/public/RoomDetail';

// Customer pages
import CustomerHome from '../pages/customer/Home';
import CustomerSearch from '../pages/customer/Search';
import BookingCreate from '../pages/customer/Booking/BookingCreate';
import BookingReview from '../pages/customer/Booking/BookingReview';
import BookingSuccess from '../pages/customer/Booking/BookingSuccess';
import BookingPayment from '../pages/customer/Booking/BookingPayment';
import CustomerBookingList from '../pages/customer/MyBookings/BookingList';
import CustomerBookingDetail from '../pages/customer/MyBookings/BookingDetail';
import ProfileView from '../pages/customer/Profile/ProfileView';
import ProfileEdit from '../pages/customer/Profile/ProfileEdit';
import ChangePassword from '../pages/customer/Settings/ChangePassword';
import CreateFeedback from '../pages/customer/Feedback/CreateFeedback';
import MyFeedbacks from '../pages/customer/Feedback/MyFeedbacks';

// Staff pages
import StaffDashboard from '../pages/staff/Dashboard';
import TodayBookings from '../pages/staff/TodayBookings';
import Checkin from '../pages/staff/Checkin';
import Checkout from '../pages/staff/Checkout';
import RoomStatus from '../pages/staff/RoomStatus';
import ServiceUsage from '../pages/staff/ServiceUsage';

// Manager pages
import ManagerDashboard from '../pages/manager/Dashboard';
import ManagerRoomList from '../pages/manager/Rooms/RoomList';
import ManagerRoomCreate from '../pages/manager/Rooms/RoomCreate';
import ManagerRoomEdit from '../pages/manager/Rooms/RoomEdit';
import ManagerBookingList from '../pages/manager/Bookings/BookingList';
import ManagerBookingDetail from '../pages/manager/Bookings/BookingDetail';
import ManagerFeedbackList from '../pages/manager/Feedbacks/FeedbackList';
import ReplyFeedback from '../pages/manager/Feedbacks/ReplyFeedback';
import ManagerServiceList from '../pages/manager/Services/ServiceList';
import ManagerServiceCreate from '../pages/manager/Services/ServiceCreate';
import ManagerServiceEdit from '../pages/manager/Services/ServiceEdit';
import ManagerPricingRequests from '../pages/manager/PricingRequests/RequestList';
import ManagerCreatePricingRequest from '../pages/manager/PricingRequests/CreateRequest';
import ManagerRevenueReport from '../pages/manager/Reports/RevenueReport';
import ManagerBookingReport from '../pages/manager/Reports/BookingReport';

// Owner pages
import OwnerDashboard from '../pages/owner/Dashboard';
import BranchList from '../pages/owner/Branches/BranchList';
import BranchCreate from '../pages/owner/Branches/BranchCreate';
import BranchEdit from '../pages/owner/Branches/BranchEdit';
import PricingList from '../pages/owner/Pricing/PricingList';
import PricingCreate from '../pages/owner/Pricing/PricingCreate';
import PricingEdit from '../pages/owner/Pricing/PricingEdit';
import OwnerPricingRequests from '../pages/owner/PricingRequests/RequestList';
import ApproveRequest from '../pages/owner/PricingRequests/ApproveRequest';
import RejectRequest from '../pages/owner/PricingRequests/RejectRequest';
import UserList from '../pages/owner/Users/UserList';
import RoleManagement from '../pages/owner/Users/RoleManagement';
import GlobalRevenue from '../pages/owner/Reports/GlobalRevenue';
import BranchComparison from '../pages/owner/Reports/BranchComparison';
import SystemLogs from '../pages/owner/Logs/SystemLogs';

const NotFound = () => (
  <div style={{textAlign:'center',padding:'80px 20px'}}>
    <div style={{fontSize:64}}>🔍</div>
    <h1 style={{fontFamily:'var(--font-display)',fontSize:32,marginBottom:8}}>404</h1>
    <p style={{color:'var(--color-muted)'}}>Trang không tồn tại</p>
    <a href="/" style={{marginTop:20,display:'inline-block',padding:'10px 24px',background:'var(--color-accent)',color:'#fff',borderRadius:'8px',fontWeight:600}}>Về trang chủ</a>
  </div>
);

const appRoutes = [
  // ── PUBLIC ──────────────────────────────
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      { path: 'rooms', element: <RoomList /> },
      { path: 'rooms/:id', element: <RoomDetail /> },
      { path: 'login', element: <GuestGuard><Login /></GuestGuard> },
      { path: 'register', element: <GuestGuard><Register /></GuestGuard> },
    ],
  },
  // ── CUSTOMER ────────────────────────────
  {
    path: '/customer',
    element: <AuthGuard><RoleGuard roles={['CUSTOMER']}><CustomerLayout /></RoleGuard></AuthGuard>,
    children: [
      { index: true, element: <CustomerHome /> },
      { path: 'search', element: <CustomerSearch /> },
      { path: 'bookings', element: <CustomerBookingList /> },
      { path: 'bookings/:id', element: <CustomerBookingDetail /> },
      { path: 'booking/create', element: <BookingCreate /> },
      { path: 'booking/review', element: <BookingReview /> },
      { path: 'booking/success', element: <BookingSuccess /> },
      { path: 'booking/payment', element: <BookingPayment /> },
      { path: 'profile', element: <ProfileView /> },
      { path: 'profile/edit', element: <ProfileEdit /> },
      { path: 'settings/password', element: <ChangePassword /> },
      { path: 'feedbacks', element: <MyFeedbacks /> },
      { path: 'feedbacks/create', element: <CreateFeedback /> },
    ],
  },
  // ── STAFF ───────────────────────────────
  {
    path: '/staff',
    element: <AuthGuard><RoleGuard roles={['STAFF']}><StaffLayout /></RoleGuard></AuthGuard>,
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: 'bookings/today', element: <TodayBookings /> },
      { path: 'checkin', element: <Checkin /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'rooms/status', element: <RoomStatus /> },
      { path: 'service-usage', element: <ServiceUsage /> },
    ],
  },
  // ── MANAGER ─────────────────────────────
  {
    path: '/manager',
    element: <AuthGuard><RoleGuard roles={['MANAGER']}><ManagerLayout /></RoleGuard></AuthGuard>,
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: 'rooms', element: <ManagerRoomList /> },
      { path: 'rooms/create', element: <ManagerRoomCreate /> },
      { path: 'rooms/:id/edit', element: <ManagerRoomEdit /> },
      { path: 'bookings', element: <ManagerBookingList /> },
      { path: 'bookings/:id', element: <ManagerBookingDetail /> },
      { path: 'feedbacks', element: <ManagerFeedbackList /> },
      { path: 'feedbacks/reply', element: <ReplyFeedback /> },
      { path: 'services', element: <ManagerServiceList /> },
      { path: 'services/create', element: <ManagerServiceCreate /> },
      { path: 'services/:id/edit', element: <ManagerServiceEdit /> },
      { path: 'pricing-requests', element: <ManagerPricingRequests /> },
      { path: 'pricing-requests/create', element: <ManagerCreatePricingRequest /> },
      { path: 'reports/revenue', element: <ManagerRevenueReport /> },
      { path: 'reports/booking', element: <ManagerBookingReport /> },
    ],
  },
  // ── OWNER ───────────────────────────────
  {
    path: '/owner',
    element: <AuthGuard><RoleGuard roles={['OWNER']}><OwnerLayout /></RoleGuard></AuthGuard>,
    children: [
      { index: true, element: <OwnerDashboard /> },
      { path: 'branches', element: <BranchList /> },
      { path: 'branches/create', element: <BranchCreate /> },
      { path: 'branches/:id/edit', element: <BranchEdit /> },
      { path: 'pricing', element: <PricingList /> },
      { path: 'pricing/create', element: <PricingCreate /> },
      { path: 'pricing/:id/edit', element: <PricingEdit /> },
      { path: 'pricing-requests', element: <OwnerPricingRequests /> },
      { path: 'pricing-requests/:id/approve', element: <ApproveRequest /> },
      { path: 'pricing-requests/:id/reject', element: <RejectRequest /> },
      { path: 'users', element: <UserList /> },
      { path: 'users/roles', element: <RoleManagement /> },
      { path: 'reports/revenue', element: <GlobalRevenue /> },
      { path: 'reports/branches', element: <BranchComparison /> },
      { path: 'logs', element: <SystemLogs /> },
    ],
  },
  { path: '*', element: <NotFound /> },
];

export default appRoutes;
