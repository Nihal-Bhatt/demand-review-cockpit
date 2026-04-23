import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { GlobalFilters } from "../lib/businessLogic";

function enc(arr: string[]) {
  return arr.join("~");
}

function dec(s: string | null) {
  return s ? s.split("~").filter(Boolean) : [];
}

export function useUrlSyncedFilters(filters: GlobalFilters, setFilters: (next: GlobalFilters) => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    const keys = ["m", "c", "e", "p", "pl", "r", "mk", "vm"] as const;
    if (keys.some((k) => searchParams.get(k))) {
      setFilters({
        months: dec(searchParams.get("m")),
        customers: dec(searchParams.get("c")),
        ceManagers: dec(searchParams.get("e")),
        packaging: dec(searchParams.get("p")),
        plants: dec(searchParams.get("pl")),
        regions: dec(searchParams.get("r")),
        markets: dec(searchParams.get("mk")),
        valueMode: searchParams.get("vm") === "u" ? "volume" : "value",
      });
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const setArr = (key: string, arr: string[]) => {
        if (!arr.length) next.delete(key);
        else next.set(key, enc(arr));
      };
      setArr("m", filters.months);
      setArr("c", filters.customers);
      setArr("e", filters.ceManagers);
      setArr("p", filters.packaging);
      setArr("pl", filters.plants);
      setArr("r", filters.regions);
      setArr("mk", filters.markets);
      next.set("vm", filters.valueMode === "volume" ? "u" : "v");
      return next;
    }, { replace: true });
  }, [filters, setSearchParams]);
}
