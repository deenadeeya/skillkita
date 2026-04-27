import React from "react";
import ReactDOM from "react-dom/client";
import HomePage from "./pages/HomePage";
import AboutUs from "./pages/HomePage/AboutUs";
import CompanyExperience from "./pages/HomePage/CompanyExperience";
import ViewCourses from "./pages/ViewCourses";
import CoursePage from "./pages/CoursePage";
import AccessDenied from "./pages/admin/AccessDenied";
import AdminLandingEditor from "./pages/admin/AdminLandingEditor";
import AdminCreateCourse from "./pages/admin/AdminCreateCourse";
import AdminManageCourses from "./pages/admin/AdminManageCourses";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminCreateQuotation from "./pages/admin/AdminCreateQuotation";
import AdminQuotations from "./pages/admin/AdminQuotations";
import AdminUsers from "./pages/admin/AdminUsers";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerProfile from "./pages/employer/EmployerProfile";
import EmployerQuotationRequest from "./pages/employer/EmployerQuotationRequest";
import EmployerTalkToAdmin from "./pages/employer/EmployerTalkToAdmin";

import "./styles/global.css";
import RequireRole from "./app/router/guards/RequireRole";

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

let Page = HomePage;

if (currentPath === "/about-us") {
  Page = AboutUs;
}

if (currentPath === "/company-experience") {
  Page = CompanyExperience;
}

if (currentPath === "/courses") {
  Page = ViewCourses;
}

if (currentPath === "/courses/view") {
  Page = CoursePage;
}

if (currentPath === "/admin") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminManageCourses />
    </RequireRole>
  );
}

if (currentPath === "/admin/courses/create") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminCreateCourse />
    </RequireRole>
  );
}

if (currentPath === "/admin/courses/edit") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminCreateCourse />
    </RequireRole>
  );
}

if (currentPath === "/admin/landing") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminLandingEditor />
    </RequireRole>
  );
}

if (currentPath === "/admin/users") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminUsers />
    </RequireRole>
  );
}

if (currentPath === "/admin/quotations") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminQuotations />
    </RequireRole>
  );
}

if (currentPath === "/admin/quotations/create") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminCreateQuotation />
    </RequireRole>
  );
}

if (currentPath === "/admin/messages") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminMessages />
    </RequireRole>
  );
}

if (currentPath === "/admin/profile") {
  Page = () => (
    <RequireRole role="admin" denied={<AccessDenied />}>
      <AdminProfile />
    </RequireRole>
  );
}

if (currentPath === "/login") {
  Page = Login;
}

if (currentPath === "/signup") {
  Page = SignUp;
}

if (currentPath === "/employer") {
  Page = () => (
    <RequireRole role="employer" requireApproved redirectTo="/login">
      <EmployerDashboard />
    </RequireRole>
  );
}

if (currentPath === "/employer/quotation") {
  Page = () => (
    <RequireRole role="employer" requireApproved redirectTo="/login">
      <EmployerQuotationRequest />
    </RequireRole>
  );
}

if (currentPath === "/employer/talk-to-admin") {
  Page = () => (
    <RequireRole role="employer" requireApproved redirectTo="/login">
      <EmployerTalkToAdmin />
    </RequireRole>
  );
}

if (currentPath === "/employer/profile") {
  Page = () => (
    <RequireRole role="employer" requireApproved redirectTo="/login">
      <EmployerProfile />
    </RequireRole>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);