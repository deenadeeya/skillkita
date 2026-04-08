import React from "react";
import ReactDOM from "react-dom/client";
import LandingPage from "./pages/LandingPage";
import ViewCourses from "./pages/ViewCourses";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLandingEditor from "./pages/admin/AdminLandingEditor";
import AdminLogin from "./pages/admin/AdminLogin";
import AccessDenied from "./pages/admin/AccessDenied";

import "./styles/global.css";

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
const roleFromQuery = new URLSearchParams(window.location.search).get("role");

if (roleFromQuery === "admin" || roleFromQuery === "public") {
  window.localStorage.setItem("skillkita-role", roleFromQuery);
}

const activeRole = window.localStorage.getItem("skillkita-role") === "admin"
  ? "admin"
  : "public";

let Page = LandingPage;

if (currentPath === "/courses") {
  Page = ViewCourses;
}

if (currentPath === "/admin") {
  Page = activeRole === "admin" ? AdminDashboard : AccessDenied;
}

if (currentPath === "/admin/landing") {
  Page = activeRole === "admin" ? AdminLandingEditor : AccessDenied;
}

if (currentPath === "/admin/login") {
  Page = AdminLogin;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);