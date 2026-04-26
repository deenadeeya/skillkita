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

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
const roleFromQuery = new URLSearchParams(window.location.search).get("role");

if (roleFromQuery === "admin" || roleFromQuery === "public") {
  window.localStorage.setItem("skillkita-role", roleFromQuery);
}

const activeRole = window.localStorage.getItem("skillkita-role") === "admin"
  ? "admin"
  : "public";

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
  Page = activeRole === "admin" ? AdminManageCourses : AccessDenied;
}

if (currentPath === "/admin/courses/create") {
  Page = activeRole === "admin" ? AdminCreateCourse : AccessDenied;
}

if (currentPath === "/admin/courses/edit") {
  Page = activeRole === "admin" ? AdminCreateCourse : AccessDenied;
}

if (currentPath === "/admin/landing") {
  Page = activeRole === "admin" ? AdminLandingEditor : AccessDenied;
}

if (currentPath === "/admin/users") {
  Page = activeRole === "admin" ? AdminUsers : AccessDenied;
}

if (currentPath === "/admin/quotations") {
  Page = activeRole === "admin" ? AdminQuotations : AccessDenied;
}

if (currentPath === "/admin/quotations/create") {
  Page = activeRole === "admin" ? AdminCreateQuotation : AccessDenied;
}

if (currentPath === "/admin/messages") {
  Page = activeRole === "admin" ? AdminMessages : AccessDenied;
}

if (currentPath === "/admin/profile") {
  Page = activeRole === "admin" ? AdminProfile : AccessDenied;
}

if (currentPath === "/login") {
  Page = Login;
}

if (currentPath === "/signup") {
  Page = SignUp;
}

if (currentPath === "/employer") {
  Page = EmployerDashboard;
}

if (currentPath === "/employer/quotation") {
  Page = EmployerQuotationRequest;
}

if (currentPath === "/employer/talk-to-admin") {
  Page = EmployerTalkToAdmin;
}

if (currentPath === "/employer/profile") {
  Page = EmployerProfile;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);