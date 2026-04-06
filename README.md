# BetterMe Admin

Admin panel for building, publishing, and analysing personalisation quiz flows. Admins design user journeys as directed acyclic graphs (DAGs), publish them, and track how real users move through each step.

---

ADMIN CREDS
```
EMAIL = admin@example.com
PASSWORD = Admin123!
```

DEPLOYED - [here](https://hackaton-task-b8310a8937f5.herokuapp.com/swagger/index.html)

FRONTEND DEPLOY - [here](https://better-me-admin2-lzwt.vercel.app/login)

BACKEND REPO - [here](https://github.com/ProdunVladyslav/Hackaton_INT20_26_Task)

AI DEMO - [here](https://www.youtube.com/watch?v=cMJUmX57-AE)

STATS DEMO - [here](https://www.youtube.com/watch?v=p3VSdWqglmk)

## Table of Contents

1. [Pages](#pages)
2. [Routing](#routing)
3. [Frontend Architecture](#frontend-architecture)
4. [Key Libraries](#key-libraries)
5. [Styling & Design System](#styling--design-system)
6. [State Management](#state-management)
7. [API Layer](#api-layer)
8. [DAG Architecture](#dag-architecture)
9. [Analytics](#analytics)
10. [Build & Dev Setup](#build--dev-setup)
11. [What Changed](#what-changed)

---

## Pages

| Page | Route | Auth | Purpose |
|------|-------|------|---------|
| **LoginPage** | `/login` | Guest only | Admin sign-in form |
| **DashboardPage** | `/dashboard` | Required | Global overview: stats, offer performance, surveys list, drop-off hotspots |
| **DagEditorPage** | `/editor/$surveyId` | Required | Visual DAG editor — add/edit nodes, edges, conditions, and save the flow |
| **FlowStatsPage** | `/stats/$flowId` | Required | Per-flow analytics: node stats, path Sankey diagram, offer performance, drop-offs |
| **SurveyPage** | `/survey/$surveyId` | Public | End-user quiz taker — step-by-step questions leading to a personalised offer |

### DashboardPage

The main hub after login. Broken into four sections rendered in order:

1. **Stats bar** — 8 KPI cards (4 × 2 grid): Total Surveys, Published, Total Sessions, In Progress, Completed, Abandoned, Completion Rate, Abandon Rate.
2. **Offer Performance** — sortable table of all offers across all flows with a donut chart that breaks impressions by flow. Clicking a donut segment or legend label filters the table to that flow; an active filter chip appears next to the sort buttons and can be dismissed by clicking it.
3. **Surveys** — searchable grid of all flow cards with edit/publish/stats/delete actions and a "Create Survey" shortcut.
4. **Drop-off Hotspots** — ranked list of nodes where users abandon most often, with drop-off rate bars.

### DagEditorPage

Full-screen canvas powered by React Flow. Left panel holds a node palette; right panel is a context-aware properties editor that changes based on what is selected (node or edge). The toolbar at the top contains Save and AI Generate buttons. Changes are tracked in a Zustand store and saved in a single diffed batch when the admin clicks Save.

### FlowStatsPage

Shows analytics for one specific flow. Top section has per-node stat cards (answers, drop-offs, offer impressions, avg duration). Below that is a Sankey diagram of the most common user paths. Further down are offer performance details and a drop-off breakdown.

### SurveyPage

Public, no-auth page consumed by end users. Fetches the published flow, renders each node as a step (question / info / offer), and posts answers to the session API. The routing logic that picks the next node runs entirely on the backend; the frontend just follows the returned `nextNodeId`.

---

## Routing

**Library:** TanStack Router v1.58.3

Routes are defined in `src/router.tsx`. Each authenticated route is wrapped in a `beforeLoad` guard that calls `requireAuth()` — a function that reads the Zustand auth store and redirects to `/login` if the user is not authenticated. The login route uses `requireGuest()` which redirects authenticated users straight to `/dashboard`.

Page transitions are handled by wrapping every route component in a Framer Motion `motion.div` with a fade + slide-up animation (opacity 0→1, y 12→0, 0.25 s ease-out).

```
/                    → redirect to /dashboard or /login
/login               → LoginPage         (requireGuest)
/dashboard           → DashboardPage     (requireAuth)
/editor/$surveyId    → DagEditorPage     (requireAuth)
/stats/$flowId       → FlowStatsPage     (requireAuth)
/survey/$surveyId    → SurveyPage        (public)
```

---

## Frontend Architecture

```
src/
├── api/                  # Axios instance + base request helpers
├── components/           # App-wide layout components
│   ├── AdminLayout.tsx   # Sticky navbar + page wrapper
│   ├── ThemeSwitcher.tsx # Dark/light mode toggle
│   └── ErrorBoundary.tsx # React error boundary
├── features/             # Feature modules (hooks, stores, components)
│   ├── analytics/        # Dashboard & flow-stats data
│   ├── auth/             # Login, logout, auth store
│   ├── content/          # Published-flow fetching (quiz taker)
│   ├── dag-editor/       # Canvas, node palette, properties panel, stores
│   ├── edges/            # Edge CRUD hooks
│   ├── flows/            # Flow CRUD hooks + flow-adapter util
│   ├── nodes/            # Node CRUD hooks
│   ├── node-offers/      # Offer↔node link hooks
│   ├── offers/           # Offer CRUD hooks
│   ├── options/          # Answer option CRUD hooks
│   ├── quiz/             # Session start/answer/back/convert mutations
│   ├── survey-client/    # Quiz-taker UI components + DAG navigator util
│   └── surveys/          # Flow card, create-flow modal, surveys store
├── pages/                # Page-level components (one per route)
├── shared/
│   ├── types/            # All API DTOs and editor types
│   ├── ui/               # Button, Input, Modal, Select, Badge, Spinner
│   ├── theme/            # Design tokens, ThemeProvider, GlobalStyles
│   └── utils/            # format.ts, donut.ts
├── test/                 # Vitest setup
├── App.tsx
├── router.tsx
└── main.tsx
```

### Feature module layout

Each feature folder follows the same pattern:

```
features/<name>/
├── components/   # React components owned by this feature
├── hooks/        # TanStack Query queries and mutations
└── store/        # Zustand slice (only if local state is non-trivial)
```

### DAG Editor internals

The editor is built on **React Flow** (`reactflow` v11). The canvas renders three custom node types — `QuestionNode`, `InfoNode`, `OfferNode` — and a custom `ConditionEdge`. All mutable state (nodes, edges, selection, dirty flags) lives in `dag.store.ts` (Zustand). When the admin hits Save, `flow-adapter.ts` diffs the current store state against the snapshot loaded from the API and fires the minimum set of REST calls needed to bring the backend in sync.

### Survey client internals

The quiz taker fetches the published flow once on mount via the content API. Navigation between steps is driven entirely by the `nextNodeId` returned by the session API after each answer submission. The frontend does not evaluate edge conditions itself — that logic runs on the server. The `dag-navigator.ts` utility only handles the "go back" traversal by maintaining a local stack of visited node IDs.

---

## Key Libraries

| Library | Version | Role |
|---------|---------|------|
| react | ^18.3.1 | UI framework |
| @tanstack/react-router | ^1.58.3 | Client-side routing with type-safe params |
| @tanstack/react-query | ^5.56.2 | Server state, caching, mutations |
| zustand | ^5.0.0 | Client state (auth, DAG editor) |
| reactflow | ^11.11.4 | Interactive DAG canvas |
| styled-components | ^6.1.13 | CSS-in-JS with theming |
| framer-motion | ^11.9.0 | Page transitions and micro-animations |
| axios | ^1.7.7 | HTTP client with interceptors |
| react-hook-form | ^7.53.0 | Form state |
| zod | ^3.23.8 | Schema validation |
| lucide-react | ^0.447.0 | Icon set |
| react-hot-toast | ^2.4.1 | Toast notifications |
| vite | ^5.4.8 | Build tool & dev server |
| typescript | ~5.5.3 | Type checking |
| vitest | ^3.0.0 | Unit test runner |

---

## Styling & Design System

All styles are written with **styled-components**. The theme is defined in `src/shared/theme/theme.ts` and injected via `ThemeProvider`. Dark and light modes are toggled at runtime via `useAppTheme()`.

**Token categories:**

| Category | Values |
|----------|--------|
| Colours | `bg`, `bgSurface`, `bgElevated`, `border`, `textPrimary`, `textSecondary`, `textTertiary`, `accent`, `accentLight`, `success`, `error`, `warning`, `info` |
| Typography sizes | `xs` · `sm` · `base` · `lg` · `xl` · `2xl` · `3xl` |
| Typography weights | `normal` · `medium` · `semibold` · `bold` |
| Spacing | 4 px base unit — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Radii | `sm` · `md` · `lg` · `xl` · `full` |
| Shadows | `sm` · `md` · `lg` · `xl` |
| Transitions | `fast` · `base` |

---

## State Management

### Zustand stores

| Store | File | Holds |
|-------|------|-------|
| Auth | `features/auth/store/auth.store.ts` | `user`, `isAuthenticated` — persisted to `localStorage` |
| DAG editor | `features/dag-editor/store/dag.store.ts` | `surveyId`, `nodes`, `edges`, `selectedNodeId`, `selectedEdgeId`, `entryNodeId`, `touched` (dirty sets), `isDirty` |
| Surveys | `features/surveys/store/surveys.store.ts` | UI state for the surveys list |

### TanStack Query

All server data goes through React Query. Global `QueryClient` config: `staleTime: 30 s`, `retry: 1`.

Representative query key patterns:

```
['flows']
['flows', flowId]
['analytics', 'sessions', 'global']
['analytics', 'offers', { flowId }]
['quiz', 'session', sessionId]
```

Mutations always call `queryClient.invalidateQueries` on success to keep the cache fresh.

---

## API Layer

**Base URL:** configured via `VITE_API_URL` env var (default `http://localhost:5000`). The Vite dev server proxies `/api` to that address.

The Axios instance (`src/api/axios.ts`) has `withCredentials: true` and a response interceptor that handles 401 (redirect to login), 5xx, and network errors with toasts.

### Admin endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/flows` | List all flows |
| POST | `/api/admin/flows` | Create flow |
| GET | `/api/admin/flows/:id` | Flow detail with nodes, edges, paths |
| PUT | `/api/admin/flows/:id` | Update flow metadata |
| PUT | `/api/admin/flows/:id/entry-node` | Set entry node |
| POST | `/api/admin/flows/:id/publish` | Publish |
| POST | `/api/admin/flows/:id/unpublish` | Unpublish |
| DELETE | `/api/admin/flows/:id` | Delete |
| POST | `/api/admin/flows/generate` | Start AI generation job |
| GET | `/api/admin/flows/generate/status/:jobId` | Poll job status |
| POST | `/api/admin/nodes` | Create node |
| PUT | `/api/admin/nodes/:id` | Update node |
| PUT | `/api/admin/nodes/:id/position` | Update canvas position |
| DELETE | `/api/admin/nodes/:id` | Delete node |
| POST | `/api/admin/edges` | Create edge |
| PUT | `/api/admin/edges/:id` | Update edge conditions/priority |
| DELETE | `/api/admin/edges/:id` | Delete edge |
| POST | `/api/admin/options` | Create answer option |
| PUT | `/api/admin/options/:id` | Update option |
| POST | `/api/admin/options/reorder` | Reorder options |
| DELETE | `/api/admin/options/:id` | Delete option |
| POST | `/api/admin/offers` | Create offer |
| PUT | `/api/admin/offers/:id` | Update offer |
| DELETE | `/api/admin/offers/:id` | Delete offer |
| POST | `/api/admin/node-offers` | Link offer to node |
| PUT | `/api/admin/node-offers/:id` | Update link (isPrimary) |
| DELETE | `/api/admin/node-offers/:id` | Unlink offer |
| GET | `/api/admin/analytics/sessions` | Session stats (global or per-flow) |
| GET | `/api/admin/analytics/offers` | Offer stats (global or per-flow) |
| GET | `/api/admin/analytics/drop-offs` | Drop-off stats (global or per-flow) |

### Quiz (public) endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/quiz/sessions` | Start session |
| GET | `/api/quiz/sessions/:id` | Get session state |
| POST | `/api/quiz/sessions/:id/answers` | Submit answer → returns `nextNodeId` |
| POST | `/api/quiz/sessions/:id/back` | Go back one step |
| POST | `/api/quiz/sessions/:id/convert` | Record offer conversion |

### Content endpoint

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/flows/:id/published` | Fetch published flow for quiz taker |

---

## DAG Architecture

The quiz flow is a **Directed Acyclic Graph** — nodes connected by directed edges with no cycles. A user enters at the designated entry node and follows edges until they reach an Offer node.

### Node types

| Type | Purpose | Collects data |
|------|---------|--------------|
| **Question** | Collects user input. Answer types: **Single Choice** (radio), **Multiple Choice** (checkboxes), **Slider** (numeric range). Bound to an `attributeKey` whose value is stored in the session for routing. | Yes |
| **Info Page** | Displays a title, body text, and optional image. The user simply taps Continue. | No |
| **Offer** | Terminal node. Shows headline, description, CTA, price, optional wellness kit details. Linked to a backend `Offer` entity. | No (triggers conversion event) |

### Edges and routing

Each edge has a **priority** (integer, higher = checked first) and optional **conditions**.

**Routing algorithm (server-side):** When the user submits an answer, the backend evaluates all outgoing edges of the current node in descending priority order. The first edge whose conditions all pass becomes the `nextNodeId`. A priority-0 unconditional edge acts as the default fallback.

**Condition comparison types:** Multiple conditions on the same edge can be combined with either **AND** (all must match) or **OR** (any must match). The comparison type is selected per-edge via a dropdown in the properties panel.

**Supported operators:**

| Operator | Meaning |
|----------|---------|
| `eq` | Equals |
| `neq` | Not equals |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `between` | Inclusive range (`value`–`valueTo`) |
| `in` | In a comma-separated list |
| `not_in` | Not in a list |
| `contains` | Contains substring |

Numeric attributes (`age`, `available_time`, `stress_level`, `sleep_level`, `energy_level`) expose numeric operators. Text/enum attributes expose `eq`, `neq`, `in`, `not_in`, `contains`.

### Attributes

Attributes are no longer limited to a fixed dropdown. Admins can define custom attributes directly in the properties panel by entering an **AttributeName** and selecting a **ValueType** (`Text` or `Numeric`). The available operators in edge conditions automatically adjust to match the chosen ValueType.

Built-in attributes for reference:

| Key | ValueType |
|-----|-----------|
| `age` | Numeric |
| `gender` | Text |
| `goal` | Text |
| `location` | Text |
| `fitness_level` | Text |
| `available_time` | Numeric |
| `injuries` | Text |
| `motivation` | Text |
| `stress_level` | Numeric |
| `sleep_level` | Numeric |
| `energy_level` | Numeric |

### Edge serialization

Conditions are stored on the backend as `conditionsJson`:
- `null` → unconditional edge
- JSON array of `{ AttributeKey, Operator, Value, ValueTo? }` objects

The `comparisonType` field (`AND` | `OR`) is stored alongside the conditions array.

### Save flow

When the admin clicks **Save** in the editor the frontend diffs canvas state vs. the last API snapshot and fires only the necessary calls:

1. Create new nodes + their options
2. Update modified node content
3. Update node canvas positions
4. Sync question options (create / update / delete / reorder)
5. Delete removed nodes
6. Create new edges
7. Update edges with changed conditions, comparison type, or priority
8. Delete removed edges
9. Reload the full flow from the API to sync server-assigned IDs

---

## Analytics

### Dashboard (global)

- **Session KPIs** — total, completed, abandoned, in-progress counts plus completion rate and abandon rate, sourced from `GET /analytics/sessions`.
- **Offer Performance table** — sortable by Presented / Converted / Conversion Rate / Name. Filterable by flow via the interactive donut chart (click a segment or legend label to apply a flow filter; a dismissible chip appears next to the sort buttons).
- **Drop-off Hotspots** — ranked list of nodes with the highest drop-off rate.

### Flow stats (`/stats/:flowId`)

- Per-node cards with answer count, drop-off count, offer impressions, conversions, and average answer duration.
- **Sankey diagram** (`FlowPathSankey.tsx`) — visualises the most-travelled user paths through the DAG step by step. Built with D3 layout + SVG rendering inside a React component. Each column represents a step in the journey; link width is proportional to the number of users who took that path. Fetches `UserNodePath` records from the flow detail endpoint.
- Per-flow offer performance breakdown.
- Per-flow drop-off ranking.

---

## Build & Dev Setup

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:5000` | Backend base URL |

### Path aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

| Alias | Resolves to |
|-------|------------|
| `@` | `src/` |
| `@shared` | `src/shared/` |
| `@features` | `src/features/` |
| `@api` | `src/api/` |
| `@pages` | `src/pages/` |
| `@assets` | `src/assets/` |

### Scripts

```bash
npm run dev          # Start Vite dev server on port 5173 (proxies /api → localhost:5000)
npm run build        # TypeScript check + production bundle
npm run preview      # Serve the production bundle locally
npm run test         # Run tests with Vitest
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report (V8, outputs lcov + text)
```

### Testing

Tests use **Vitest** with a jsdom environment and `@testing-library/react`. Test files are co-located with the code they test (`*.test.ts` / `*.test.tsx`).

---

## What Changed

### AI flow generation

Admins can now describe a quiz in plain text and have Claude generate the full node/edge structure automatically.

**How it works on the frontend:**

1. A text area in the editor toolbar (or a modal) sends a `POST /api/admin/flows/generate` with the description string. The server starts a background job and returns a `jobId`.
2. The client enters a **polling loop** — it calls `GET /api/admin/flows/generate/status/:jobId` every few seconds using a TanStack Query `refetchInterval` until the job status changes to `completed` or `failed`.
3. On completion the generated `flowId` is returned; the editor navigates to `/editor/:flowId` and loads the new flow from the API.

### Statistics & user path tracking

The analytics layer was extended with a `UserNodePath` field on session records. This field captures the ordered sequence of node IDs a user visited during their session.

**Frontend impact:**

- `FlowStatsPage` reads `UserNodePath` data from the flow detail API response.
- `FlowPathSankey.tsx` consumes these path sequences to build the Sankey layout: paths are aggregated by step position, then D3 computes link widths proportional to the number of users sharing each transition.
- The analytics hooks (`useAnalytics.ts`) expose the new per-flow path data through the existing `['flows', flowId]` query.

### Custom attribute parameters

Previously, admins could only pick an attribute for a Question node from a fixed dropdown list. Now they can define their own:

- **AttributeName** — free-text field the admin types into.
- **ValueType** — `Text` or `Numeric` selector.

**Frontend impact:**

- The Question node properties panel replaced the attribute dropdown with a text input (`AttributeName`) and a `ValueType` selector.
- The edge condition builder reads the `ValueType` of the source question's attribute and filters the operator list accordingly: numeric attributes get `gt`, `gte`, `lt`, `lte`, `between`; text attributes get `eq`, `neq`, `in`, `not_in`, `contains`.
- The `api.types.ts` DTOs were updated to carry `AttributeName` and `ValueType` alongside the existing `AttributeKey`.

### OR comparison type between edge conditions

Edge conditions previously always used AND logic. Admins can now switch to OR so that any matching condition triggers the edge.

**Frontend impact:**

- A `ComparisonType` dropdown (`AND` | `OR`) was added to the edge properties panel, rendered above the conditions list.
- The value is stored on the edge DTO (`conditionsComparisonType`) and sent in `POST /edges` and `PUT /edges/:id` payloads.
- The edge label rendered on the canvas reflects the active comparison type.

### DAG constructor & survey bug fixes

Several issues in the editor and public quiz were resolved:

- **Duplicate-edge guard** — creating an edge between two nodes that already have a connection is now blocked in the frontend before the API call is made.
- **Edge condition validation** — the Save flow now validates that every conditional edge has at least one complete condition rule (attributeKey + operator + value) before submitting; incomplete rules surface as inline errors in the properties panel.
- **Node validation** — Question nodes without a title or with zero options, and Offer nodes without a linked offer entity, are flagged with a warning badge on the canvas.
- **Routing fix** — a bug where the quiz taker could get stuck on a node when no edge matched (instead of showing a fallback) was fixed by ensuring the server always returns the unconditional fallback edge if present.
