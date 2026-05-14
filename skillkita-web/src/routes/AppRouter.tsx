import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import RequireRole from "../app/router/guards/RequireRole";

import HomePage from "./public/HomeRoute";
import AboutUs from "./public/AboutUsRoute";
import CompanyExperience from "./public/CompanyExperienceRoute";
import ViewCourses from "./public/CoursesRoute";
import CoursePage from "./public/CourseDetailRoute";

import AccessDenied from "./admin/AccessDeniedRoute";
import AdminLandingEditor from "./admin/AdminLandingRoute";
import AdminCreateCourse from "./admin/AdminCoursesCreateRoute";
import AdminManageCourses from "./admin/AdminIndexRoute";
import AdminMessages from "./admin/AdminMessagesRoute";
import AdminProfile from "./admin/AdminProfileRoute";
import AdminCreateQuotation from "./admin/AdminQuotationsCreateRoute";
import AdminQuotations from "./admin/AdminQuotationsRoute";
import AdminUsers from "./admin/AdminUsersRoute";
import AdminJd14Route from "./admin/AdminJd14Route";
import AdminPaymentReceiptsRoute from "./admin/AdminPaymentReceiptsRoute";

import Login from "./auth/LoginRoute";
import SignUp from "./auth/SignUpRoute";

import EmployerDashboard from "./employer/EmployerIndexRoute";
import EmployerProfile from "./employer/EmployerProfileRoute";
import EmployerQuotationRequest from "./employer/EmployerQuotationRoute";
import EmployerTalkToAdmin from "./employer/EmployerTalkToAdminRoute";
import EmployerJd14Route from "./employer/EmployerJd14Route";
import EmployerPaymentReceiptRoute from "./employer/EmployerPaymentReceiptRoute";

import AppShell from "../app/layout/AppShell";

export default function AppRouter() {
  return (
    <BrowserRouter>
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
              <RequireRole role="employer" requireApproved redirectTo="/login">
                <EmployerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/employer/quotation"
            element={
              <RequireRole role="employer" requireApproved redirectTo="/login">
                <EmployerQuotationRequest />
              </RequireRole>
            }
          />
          <Route
            path="/employer/talk-to-admin"
            element={
              <RequireRole role="employer" requireApproved redirectTo="/login">
                <EmployerTalkToAdmin />
              </RequireRole>
            }
          />
          <Route
            path="/employer/profile"
            element={
              <RequireRole role="employer" requireApproved redirectTo="/login">
                <EmployerProfile />
              </RequireRole>
            }
          />
          <Route
            path="/employer/jd14"
            element={
              <RequireRole role="employer" requireApproved redirectTo="/login">
                <EmployerJd14Route />
              </RequireRole>
            }
          />
          <Route
            path="/employer/payment-receipt"
            element={
              <RequireRole role="employer" requireApproved redirectTo="/login">
                <EmployerPaymentReceiptRoute />
              </RequireRole>
            }
          />

          {/* Basic fallback: redirect unknown routes home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

