import React from "react";
import ReactDOM from "react-dom/client";
import AdminDashboard from "./AdminDashboard";
import LandingPage from "./LandingPage";
import ViewCourses from "./ViewCourses";

import "./index.css";

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
const roleFromQuery = new URLSearchParams(window.location.search).get("role");

if (roleFromQuery === "admin" || roleFromQuery === "public") {
  window.localStorage.setItem("skillkita-role", roleFromQuery);
}

const activeRole = window.localStorage.getItem("skillkita-role") === "admin"
  ? "admin"
  : "public";

const AccessDenied = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F1E8] px-6 text-center">
    <h1 className="text-4xl font-bold text-[#7A1F1F]">Admin Access Required</h1>
    <p className="mt-3 text-base text-black md:text-lg">
      This page is for admin users only.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <a
        href="/"
        className="rounded-lg bg-[#7A1F1F] px-4 py-2 font-semibold text-white"
      >
        Back to Landing Page
      </a>
      <a
        href="/admin?role=admin"
        className="rounded-lg border border-[#7A1F1F] px-4 py-2 font-semibold text-[#7A1F1F]"
      >
        Enter as Admin
      </a>
    </div>
  </div>
);

let Page = LandingPage;

if (currentPath === "/courses") {
  Page = ViewCourses;
}

if (currentPath === "/admin") {
  Page = activeRole === "admin" ? AdminDashboard : AccessDenied;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);