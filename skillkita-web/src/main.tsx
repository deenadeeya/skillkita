import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";

import "./styles/global.css";

// After `npm run build`, a service worker can linger on localhost and break Supabase fetch in dev.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);