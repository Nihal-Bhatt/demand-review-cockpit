import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ExecutiveSummaryView } from "./views/ExecutiveSummaryView";
import { DemandOutlookView } from "./views/DemandOutlookView";
import { ForecastPerformanceView } from "./views/ForecastPerformanceView";
import { DemandExceptionsView } from "./views/DemandExceptionsView";
import { CapacityView } from "./views/CapacityView";
import { NpdReadinessView } from "./views/NpdReadinessView";
import { IssuesView } from "./views/IssuesView";
import { ActionTrackerView } from "./views/ActionTrackerView";
import { DataAdminView } from "./views/DataAdminView";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="executive" replace />} />
        <Route path="executive" element={<ExecutiveSummaryView />} />
        <Route path="outlook" element={<DemandOutlookView />} />
        <Route path="forecast" element={<ForecastPerformanceView />} />
        <Route path="exceptions" element={<DemandExceptionsView />} />
        <Route path="capacity" element={<CapacityView />} />
        <Route path="npd" element={<NpdReadinessView />} />
        <Route path="issues" element={<IssuesView />} />
        <Route path="actions" element={<ActionTrackerView />} />
        <Route path="data" element={<DataAdminView />} />
      </Route>
    </Routes>
  );
}
