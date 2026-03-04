# CLAUDE.md — AI Assistant Guide for `unknown-known`

## Project Overview

This is an interactive educational web application focused on teaching Azure cloud concepts. The main feature is a comprehensive, multi-module Azure Sandbox dashboard built with React, TypeScript, and Tailwind CSS via shadcn/ui components.

**Tech Stack:**
- React 18.3.1 + TypeScript 5.8.3
- Vite 5.4.19 (build tool, dev server on port 8080)
- Tailwind CSS 3.4.17 + shadcn/ui (49 pre-built components)
- React Router 6 (client-side routing)
- TanStack React Query 5 (data fetching/caching)
- React Hook Form + Zod (form state and validation)
- Recharts (charting)
- Lucide React (icons)
- Vitest + React Testing Library (unit tests)

---

## Repository Structure

```
unknown-known/
├── public/               # Static assets (favicon, robots.txt)
├── src/
│   ├── components/
│   │   ├── ui/           # 49 shadcn/ui components (DO NOT manually edit)
│   │   └── NavLink.tsx   # Custom React Router NavLink wrapper
│   ├── hooks/
│   │   ├── use-mobile.tsx  # Responsive mobile detection
│   │   └── use-toast.ts    # Toast notification hook
│   ├── lib/
│   │   └── utils.ts      # cn() utility (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── Index.tsx         # Home page — renders AzureSandbox
│   │   ├── AzureSandbox.tsx  # Main app (~3,300 lines, 11 learning modules)
│   │   └── NotFound.tsx      # 404 page
│   ├── test/
│   │   ├── setup.ts          # Vitest setup with matchMedia mock
│   │   └── example.test.ts   # Example test
│   ├── App.tsx           # Root component with providers and routing
│   ├── main.tsx          # React DOM entry point
│   ├── index.css         # Tailwind directives + global HSL design tokens
│   └── App.css           # App-level styles and animations
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
└── components.json       # shadcn/ui configuration
```

---

## Development Commands

```bash
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build
npm run build:dev    # Dev build (includes component tagger)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm test             # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
```

**Install dependencies:**
```bash
npm install
# or with Bun:
bun install
```

---

## Key Conventions

### TypeScript
- Strict mode is **disabled** (`strict: false` in `tsconfig.app.json`)
- `noImplicitAny: false`, `strictNullChecks: false` — lenient type checking
- Path alias `@/` maps to `./src/` (use `@/components/...` etc.)
- Build tools (`vite.config.ts`, etc.) use strict TypeScript via `tsconfig.node.json`

### Styling
- Use **Tailwind CSS utility classes** exclusively — no raw CSS unless extending design tokens
- Use the `cn()` utility from `@/lib/utils` to merge conditional classes:
  ```ts
  import { cn } from "@/lib/utils";
  <div className={cn("base-class", condition && "conditional-class")} />
  ```
- Colors are defined as **HSL CSS variables** in `src/index.css`. Always use semantic tokens (`bg-background`, `text-foreground`, `border`, etc.) rather than raw Tailwind colors
- Dark mode uses `class` strategy — add `dark` class to `<html>` element

### Components
- **UI components** in `src/components/ui/` are sourced from shadcn/ui — prefer adding new shadcn components via the CLI rather than creating from scratch:
  ```bash
  npx shadcn-ui@latest add <component-name>
  ```
- Custom components go in `src/components/` (not inside `ui/`)
- Page-level components go in `src/pages/`

### Routing
- React Router v6 with `BrowserRouter` in `App.tsx`
- Add new routes in `src/App.tsx` inside the `<Routes>` block
- Use `<NavLink>` from `@/components/NavLink.tsx` for navigation links with active state styling

### State Management
- **Local UI state**: `useState` / `useReducer`
- **Server/async state**: React Query (`useQuery`, `useMutation`) — client is initialized in `App.tsx`
- **Forms**: React Hook Form with Zod schemas for validation
- No global state store (Redux, Zustand, etc.) is used

### Testing
- Test files match pattern `src/**/*.{test,spec}.{ts,tsx}`
- Place tests alongside source files or in `src/test/`
- Vitest with jsdom environment — `matchMedia` is mocked in `src/test/setup.ts`
- Use `@testing-library/react` for component tests
- Run `npm test` before submitting changes

### ESLint
- React Hooks rules enforced (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`)
- `@typescript-eslint/no-unused-vars` is disabled
- Always run `npm run lint` and resolve warnings before committing

---

## Core Application: AzureSandbox.tsx

The main component (`src/pages/AzureSandbox.tsx`, ~3,300 lines) is a multi-tab interactive Azure learning dashboard. It contains 11 educational modules:

| Module | Content |
|---|---|
| Responsibility | Shared Responsibility Model |
| Hierarchy | Azure Resource Hierarchy |
| Regions | Regions & Availability Zones |
| Compute | VMs, App Service, Functions, Containers |
| Networking | VNets, Load Balancers, DNS, Gateways |
| Storage | Storage types, Redundancy options |
| Identity | Azure AD, Zero Trust, RBAC |
| Governance | Policy, Blueprints, Management Groups |
| Costs | Pricing calculator, Cost management |
| Monitoring | Metrics, Alerts, Log Analytics |
| Migration | Azure Migrate, Database Migration Service |

When modifying `AzureSandbox.tsx`:
- The file is large — read the specific section you need before editing
- Each module is organized as a tab panel inside the main `<Tabs>` component
- Simulated metrics use `useState` and `useEffect` for real-time updates
- Keep educational content accurate to actual Azure service capabilities

---

## Providers and App Shell

`src/App.tsx` wraps the app with:
1. `QueryClientProvider` — React Query client
2. `TooltipProvider` — Radix UI tooltip context
3. `BrowserRouter` — client-side routing
4. `<Toaster>` + `<Sonner>` — toast notification renderers

When adding new global context providers, add them here, keeping them in order from outermost to innermost.

---

## Path Aliases

| Alias | Resolves To |
|---|---|
| `@/components` | `src/components/` |
| `@/components/ui` | `src/components/ui/` |
| `@/hooks` | `src/hooks/` |
| `@/lib` | `src/lib/` |
| `@/pages` | `src/pages/` |

---

## Adding New Features

1. **New page**: Create `src/pages/MyPage.tsx`, add a route in `src/App.tsx`
2. **New UI component**: Run `npx shadcn-ui@latest add <name>` or create in `src/components/`
3. **New hook**: Add to `src/hooks/` following the `use-` naming convention
4. **New utility**: Add to `src/lib/utils.ts` or create a new file under `src/lib/`
5. **New data fetching**: Use React Query `useQuery` or `useMutation`

---

## What NOT to Do

- Do not manually edit files inside `src/components/ui/` — use the shadcn/ui CLI to add/update
- Do not use raw CSS colors — use Tailwind semantic tokens backed by HSL variables
- Do not add a global state library without discussion — React Query + local state is sufficient
- Do not push directly to `master` — always use feature branches
- Do not skip `npm run lint` and `npm test` before committing
