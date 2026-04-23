import { useDashboard } from "../../context/DashboardContext";
import { useUrlSyncedFilters } from "../../hooks/useUrlSyncedFilters";

export function UrlHydration() {
  const { filters, setFilters } = useDashboard();
  useUrlSyncedFilters(filters, setFilters);
  return null;
}
