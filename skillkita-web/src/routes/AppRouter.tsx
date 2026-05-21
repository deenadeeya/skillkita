import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import RequireRole from "../app/router/guards/RequireRole";
import AppShell from "../app/layout/AppShell";
import RouteLoadingFallback from "../shared/ui/RouteLoadingFallback";

const HomePage = lazy(() => import("./public/HomeRoute"));
const AboutUs = lazy(() => import("./public/AboutUsRoute"));
const CompanyExperience = lazy(() => import("./public/CompanyExperienceRoute"));
const ViewCourses = lazy(() => import("./public/CoursesRoute"));
const CoursePage = lazy(() => import("./public/CourseDetailRoute"));

const AccessDenied = lazy(() => import("./admin/AccessDeniedRoute"));
const AdminLandingEditor = lazy(() => import("./admin/AdminLandingRoute"));
const AdminCreateCourse = lazy(() => import("./admin/AdminCoursesCreateRoute"));
const AdminManageCourses = lazy(() => import("./admin/AdminIndexRoute"));
const AdminMessages = lazy(() => import("./admin/AdminMessagesRoute"));
const AdminProfile = lazy(() => import("./admin/AdminProfileRoute"));
const AdminCreateQuotation = lazy(() => import("./admin/AdminQuotationsCreateRoute"));
const AdminQuotations = lazy(() => import("./admin/AdminQuotationsRoute"));
const AdminUsers = lazy(() => import("./admin/AdminUsersRoute"));
const AdminJd14Route = lazy(() => import("./admin/AdminJd14Route"));
const AdminPaymentReceiptsRoute = lazy(() => import("./admin/AdminPaymentReceiptsRoute"));

const Login = lazy(() => import("./auth/LoginRoute"));
const SignUp = lazy(() => import("./auth/SignUpRoute"));

const EmployerDashboard = lazy(() => import("./employer/EmployerIndexRoute"));
const EmployerProfile = lazy(() => import("./employer/EmployerProfileRoute"));
const EmployerQuotationRequest = lazy(() => import("./employer/EmployerQuotationRoute"));
const EmployerTalkToAdmin = lazy(() => import("./employer/EmployerTalkToAdminRoute"));
const EmployerJd14Route = lazy(() => import("./employer/EmployerJd14Route"));
const EmployerPaymentReceiptRoute = lazy(() => import("./employer/EmployerPaymentReceiptRoute"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/company-experience" element={<CompanyExperience />} />

            <Route path="/courses" element={<ViewCourses />} />
            {/* Keep existing query-string style: /courses/view?id=... */}
            <Route path="/courses/view" element={<CoursePage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/admin"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminManageCourses />
                </RequireRole>
              }
            />
            <Route
              path="/admin/courses/create"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminCreateCourse />
                </RequireRole>
              }
            />
            <Route
              path="/admin/courses/edit"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminCreateCourse />
                </RequireRole>
              }
            />
            <Route
              path="/admin/landing"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminLandingEditor />
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminUsers />
                </RequireRole>
              }
            />
            <Route
              path="/admin/quotations"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminQuotations />
                </RequireRole>
              }
            />
            <Route
              path="/admin/quotations/create"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminCreateQuotation />
                </RequireRole>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminMessages />
                </RequireRole>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminProfile />
                </RequireRole>
              }
            />
            <Route
              path="/admin/jd14"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminJd14Route />
                </RequireRole>
              }
            />
            <Route
              path="/admin/payment-receipts"
              element={
                <RequireRole role="admin" denied={<AccessDenied />}>
                  <AdminPaymentReceiptsRoute />
                </RequireRole>
              }
            />

            <Route
              path="/employer"
              element={
                <RequireRole role="employer" redirectTo="/login">
                  <EmployerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/employer/quotation"
              element={
                <RequireRole role="employer" redirectTo="/login">
                  <EmployerQuotationRequest />
                </RequireRole>
              }
            />
            <Route
              path="/employer/talk-to-admin"
              element={
                <RequireRole role="employer" redirectTo="/login">
                  <EmployerTalkToAdmin />
                </RequireRole>
              }
            />
            <Route
              path="/employer/profile"
              element={
                <RequireRole role="employer" redirectTo="/login">
                  <EmployerProfile />
                </RequireRole>
              }
            />
            <Route
              path="/employer/jd14"
              element={
                <RequireRole role="employer" redirectTo="/login">
                  <EmployerJd14Route />
                </RequireRole>
              }
            />
            <Route
              path="/employer/payment-receipt"
              element={
                <RequireRole role="employer" redirectTo="/login">
                  <EmployerPaymentReceiptRoute />
                </RequireRole>
              }
            />

            {/* Basic fallback: redirect unknown routes home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
