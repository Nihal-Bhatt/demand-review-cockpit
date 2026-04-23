import { Filter, X } from "lucide-react";
import { useMemo } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { labels } from "../../config/labels";

function uniq(values: string[]) {
  return [...new Set(values)].filter(Boolean).sort();
}

export function GlobalFilterBar() {
  const { datasets, filters, setFilters, demoMode } = useDashboard();

  const options = useMemo(() => {
    const d = datasets.demandOutlook;
    return {
      months: uniq(d.map((r) => r.month)),
      customers: uniq(d.map((r) => r.customer)),
      ceManagers: uniq(d.map((r) => r.ceManager)),
      packaging: uniq(d.map((r) => r.packagingType)),
      plants: uniq(d.map((r) => r.plant)),
      regions: uniq(d.map((r) => r.region)),
      markets: uniq(d.map((r) => r.market)),
    };
  }, [datasets.demandOutlook]);

  const toggle = (key: keyof typeof filters, value: string) => {
    const cur = filters[key];
    if (!Array.isArray(cur)) return;
    const exists = cur.includes(value);
    const nextArr = exists ? cur.filter((v) => v !== value) : [...cur, value];
    setFilters({ ...filters, [key]: nextArr });
  };

  const clear = () => {
    setFilters({
      months: [],
      customers: [],
      ceManagers: [],
      packaging: [],
      plants: [],
      regions: [],
      markets: [],
      valueMode: filters.valueMode,
    });
  };

  const activeCount =
    filters.months.length +
    filters.customers.length +
    filters.ceManagers.length +
    filters.packaging.length +
    filters.plants.length +
    filters.regions.length +
    filters.markets.length;

  return (
    <div className="border-b border-surface-border bg-surface-panel/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-6 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-surface-dim">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-surface-dim ring-1 ring-surface-border">
            <Filter className="h-3.5 w-3.5" />
            Global filters
            {activeCount ? (
              <span className="rounded-full bg-accent-royal/25 px-2 py-0.5 text-[11px] font-semibold text-accent-ice-tint">
                {activeCount} active
              </span>
            ) : null}
          </span>
          {!demoMode ? (
            <span className="text-xs text-surface-soft">Live data mode: filters apply to uploaded datasets.</span>
          ) : (
            <span className="text-xs text-surface-soft">Demo mode: sample {labels.appTitle.toLowerCase()} dataset.</span>
          )}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-7">
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("months", v);
              e.target.value = "";
            }}
          >
            <option value="">Month (+)</option>
            {options.months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("customers", v);
              e.target.value = "";
            }}
          >
            <option value="">Customer (+)</option>
            {options.customers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("ceManagers", v);
              e.target.value = "";
            }}
          >
            <option value="">CE manager (+)</option>
            {options.ceManagers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("packaging", v);
              e.target.value = "";
            }}
          >
            <option value="">Packaging (+)</option>
            {options.packaging.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("plants", v);
              e.target.value = "";
            }}
          >
            <option value="">Plant (+)</option>
            {options.plants.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("regions", v);
              e.target.value = "";
            }}
          >
            <option value="">Region (+)</option>
            {options.regions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) toggle("markets", v);
              e.target.value = "";
            }}
          >
            <option value="">Market (+)</option>
            {options.markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <Select
            value={filters.valueMode}
            onChange={(e) =>
              setFilters({ ...filters, valueMode: e.target.value === "volume" ? "volume" : "value" })
            }
            aria-label="Value or volume mode"
          >
            <option value="value">Measure: Value</option>
            <option value="volume">Measure: Volume</option>
          </Select>
          <Button variant="secondary" onClick={clear} disabled={!activeCount}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {activeCount ? (
        <div className="mx-auto max-w-[1600px] px-6 pb-3">
          <div className="flex flex-wrap gap-2">
            {filters.months.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("months", m)}
                title="Remove"
              >
                Month: {m} ×
              </button>
            ))}
            {filters.customers.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("customers", m)}
              >
                Customer: {m} ×
              </button>
            ))}
            {filters.ceManagers.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("ceManagers", m)}
              >
                CE: {m} ×
              </button>
            ))}
            {filters.packaging.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("packaging", m)}
              >
                Pack: {m} ×
              </button>
            ))}
            {filters.plants.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("plants", m)}
              >
                Plant: {m} ×
              </button>
            ))}
            {filters.regions.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("regions", m)}
              >
                Region: {m} ×
              </button>
            ))}
            {filters.markets.map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full bg-accent-royal px-3 py-1 text-xs font-semibold text-surface-on hover:bg-accent-royal-dark"
                onClick={() => toggle("markets", m)}
              >
                Market: {m} ×
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
