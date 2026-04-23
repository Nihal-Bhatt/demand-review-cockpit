# Demand Review · S&OP Cockpit

Single-page React application for a monthly **Demand Review** / **S&OP** workflow in food and pet food supply chains. The UI is designed as a lightweight control tower: executive summary, outlook, forecast quality, exceptions, capacity constraints, NPD readiness, upside/risk/strategic issues, actions, and a data admin surface for Excel ingestion.

## Theme and colour palette

The UI uses a **dark foundation** with tokens in `tailwind.config.js`:

- **Neutrals** (`surface.*`): near-black app background, charcoal/panel surfaces, mid-gray borders and gridlines, off-white primary copy.
- **Royal blue** (`accent.royal.*`): primary actions, active navigation, demand series in capacity chart.
- **Teal / green** (`accent.teal.*`): positive / healthy / committed-style states, FCA line, waterfall “uplift” and totals emphasis.
- **Light blue** (`accent.ice.*`): informational accents, secondary chart series, scatter and tooltips.
- **Orange** (`accent.orange.*`): risk, downside, overdue, high-severity highlights.
- **Gold** (`accent.gold.*`): warnings, attention, supply-review callouts.

Recharts hex values mirror the same system in `src/theme/chartColors.ts` so charts stay on-palette.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts
- TanStack Table
- SheetJS (`xlsx`)
- `html2canvas` + `jspdf` for PNG/PDF exports of the main pane
- `lucide-react` icons
- Hash routing for easy static hosting (for example GitHub Pages)

## Quick start

```bash
cd "/Users/Nihal_Bhatt/TW Demand Review"
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## GitHub Pages

This project sets `base: "./"` in `vite.config.ts` and uses `HashRouter`, so it works from a **project** Pages URL (under `/<repo>/`) without extra server rewrites.

### One-time setup on GitHub

1. Push the repo (including `.github/workflows/deploy-pages.yml`).
2. Open the repo on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch” unless you prefer that flow).
4. Push to **`main`** (or run the workflow manually: **Actions** → **Deploy GitHub Pages** → **Run workflow**). The Action builds with `npm run build` and publishes `dist/`.
5. When the workflow finishes, **Pages** shows your site URL (often within a minute). Example: `https://<user>.github.io/<repo>/#/executive`.

If the workflow fails, open **Actions** → the failed run → read the job log (common fixes: ensure the default branch is `main`, or edit the workflow `branches` list to match yours).

## Demo mode vs live data

- **Demo mode (default):** loads a rich in-browser mock dataset (`src/data/mockData.ts`) so every tab works immediately.
- **Live mode:** turn **Demo mode** off in **Data Admin / Upload**. Upload Excel per logical dataset; the app parses sheets with SheetJS and maps columns to semantic fields. Missing datasets render as empty states with guidance, not hard crashes.

Mappings and demo toggle persist in `localStorage` for the browser profile.

## Excel upload and column mapping

1. Go to **Data Admin / Upload**.
2. Choose the **target dataset** (for example `demandOutlook`).
3. Drag/drop an `.xlsx` file (or pick one from disk).
4. Select the **sheet** to ingest.
5. Click **Parse & refresh dataset**.
6. Under **Column mapping**, align each **semantic field** to the **Excel header row** string (case and spelling should match the workbook).

You can download:

- **All datasets (multi-sheet)** workbook with suggested headers per sheet.
- Per-dataset templates from the same screen.

Templates are generated client-side; you do not need Node scripts to create them.

### Expected logical datasets

The app supports these dataset keys (each can be its own workbook or a sheet in a combined workbook):

1. `demandOutlook`
2. `budget`
3. `forecastPerformance`
4. `actuals`
5. `capacity`
6. `npdReadiness`
7. `issues`
8. `actions`
9. `demandExceptions`

Semantic fields per dataset are declared in `src/config/defaultColumnMappings.ts` (`SEMANTIC_FIELDS` and `DEFAULT_COLUMN_HINTS`).

## Thresholds and labels

- **Thresholds:** edit `src/config/thresholds.json` (capacity utilization bands, forecast quality cutoffs, exception scoring weights, NPD horizon). These values drive heatmaps, utilization coloring, and exception logic.
- **Labels:** edit `src/config/labels.json` for user-facing strings such as the app subtitle and handoff title.

## Global filters and URL state

The global filter bar supports multi-select chips for month, customer, CE manager, packaging, plant, region, and market, plus **value vs volume** mode. Filter selections are mirrored into the URL query string (after the `#`), so links are shareable within the same browser profile.

## Exports

- **PNG / PDF:** buttons in the header capture the main content pane (below the tabs).
- **CSV / Excel:** available on key tabs (Demand Outlook, Capacity handoff, Actions, Forecast red list).

## Project structure (high level)

- `src/views/` — tab screens
- `src/components/` — reusable UI (KPI cards, charts, tables, drawer, upload)
- `src/context/DashboardContext.tsx` — lightweight app state (data, filters, uploads, edits)
- `src/lib/` — formatting, business logic, Excel ingest, exports
- `src/types/` — shared TypeScript models
- `src/config/` — thresholds, labels, default mappings
- `src/data/mockData.ts` — deterministic-style mock generator for demo mode

## Security note

All parsing happens **in the browser**. Do not upload highly sensitive workbooks on shared machines unless your security policy allows it.

## Maintenance tips

- Prefer extending **semantic fields** in `defaultColumnMappings.ts` over hardcoding new columns in views.
- Keep charts bound to **derived datasets** from context so they stay refreshable from Excel without code edits.
- When adding a new tab, register the route in `src/App.tsx` and add a `NavLink` in `src/components/layout/AppShell.tsx`.
