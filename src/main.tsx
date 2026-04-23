import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";
import { UrlHydration } from "./components/layout/UrlHydration";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <DashboardProvider>
        <UrlHydration />
        <App />
      </DashboardProvider>
    </HashRouter>
  </React.StrictMode>,
);
