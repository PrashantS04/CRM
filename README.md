# PrivateInvest CRM (UI)

React + TypeScript implementation of the manager's `PrivateInvest_CRM_Professional_Prototype.html`
(reference only). Data is mocked behind an async API layer, so the real Spring Boot backend can replace it
without touching any screen.

## Commands

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server on http://localhost:5173           |
| `npm run build`     | Type-check and production build               |
| `npm run typecheck` | TypeScript only                               |
| `npm run lint`      | oxlint (react, typescript, a11y rules)        |
| `npm run format`    | Prettier                                      |
| `npm test`          | Vitest + Testing Library (unit + app-level)   |

## Stack

Vite 8 · React 19 · TypeScript 6 (strict) · MUI 9 + Tailwind 4 · react-router-dom 7 (lazy routes) ·
TanStack Query · React Hook Form + zod · dnd-kit (kanban) · Recharts · lucide-react.
Same family as `PI_CRM/LMS-CRM-POC`.

## Where things live

```
src/
  theme/        tokens.ts  ← the ONLY place colours, radii and shadows are defined
                cssVars.ts (tokens → --pi-* CSS variables), muiTheme.ts (tokens → MUI)
  styles/       index.css  – Tailwind utility names mapped to the --pi-* variables
  components/   ui/ (Button, Card, Badge, DataTable, Modal, Tabs, Timeline, ...)
                form/ (React Hook Form bound inputs), charts/, kanban/, feedback/ (toast, loaders)
  features/     dashboard · opportunities · people · entities · tasks · notes · reports · settings
                (each: pages, dialogs, hooks.ts for queries/mutations, schema.ts for zod)
  api/          one module per resource + queryKeys.ts; mocks/ holds the seed data
  lib/          pure helpers (format, date, validators, export, contact links) — all unit tested
  app/          providers, routes (lazy), layout shell, navigation config
```

## Conventions

- **Colour is defined once** in `src/theme/tokens.ts`. Use Tailwind names (`text-brand`, `bg-canvas`,
  `border-line`) or MUI theme palette — never a hex value in a component. Charts import `palette`/`chartSeries`.
- **Reuse before writing**: new screens compose `components/ui` (`PageHeader`, `Card`, `DataTable`,
  `FormDialog`, `QueryState`, `RecordLayout`...). Pipeline differences (Loan vs Investment) live in
  `features/opportunities/config.ts`.
- **Server state** goes through TanStack Query hooks in each feature's `hooks.ts`; keys come from `api/queryKeys.ts`.
- **Forms** use `useZodForm(schema, defaults)` + `FormDialog` + `Form*` controls.
- **Hard gates** (brief §2.4): G1 duplicate ACN/ABN → `api/entities.ts`; G2 format → `features/entities/schema.ts`.

## Known gaps (prototype parity, not built)

- Auth (Microsoft 365 /, brief §6.2) is deliberately not implemented yet.
- Several prototype buttons only show a notice (report builder, Log call, New event, Edit forms...) exactly as
  the prototype's `alert()`s did. PDF export is a notice; CSV/XLS download the filtered list.
- Gates G3–G6, the LMS field-map confirmation screen (C4), Security holder, Tranches and the CP tab are not in
  the prototype and not built.
- The prototype includes items the brief says not to build (lead category/status, custom pipelines, chart
  customiser, custom comparison dashboard...). They are included at the owner's request and are isolated
  by feature, so they can be removed cleanly.
