# 06 - Frontend Architecture

Two Next.js 15 apps share `packages/ui`, `packages/hooks`, `packages/api-client`, `packages/types`. Only `apps/web` depends on `packages/ar-engine`.

---

## 1. Applications

| App | Port (dev) | Audience | AR |
|-----|------------|----------|-----|
| `apps/web` | 3000 | Customers | Yes |
| `apps/admin` | 3001 | Staff | Preview optional |

---

## 2. Routing - apps/web

```
app/
├── (marketing)/
│   ├── page.tsx                 # Landing
│   └── layout.tsx
├── (shop)/
│   ├── layout.tsx               # Shop chrome: header, footer
│   ├── products/page.tsx        # Catalog
│   ├── products/[slug]/page.tsx # PDP
│   └── categories/[slug]/page.tsx
├── try-on/
│   └── [productId]/page.tsx     # Client-heavy try-on
├── account/
│   ├── layout.tsx               # Auth gate
│   ├── page.tsx
│   └── captures/page.tsx
├── login/page.tsx
├── register/page.tsx
├── layout.tsx                   # Root providers
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

**Route groups** isolate marketing chrome from shop chrome without URL segments.

---

## 3. Routing - apps/admin

```
app/
├── (auth)/login/page.tsx
├── (dashboard)/
│   ├── layout.tsx               # Sidebar + topbar
│   ├── page.tsx                 # Overview analytics
│   ├── products/...
│   ├── categories/...
│   ├── assets/...
│   ├── users/...
│   ├── settings/...
│   ├── analytics/...
│   └── audit-logs/...
└── layout.tsx
```

Admin routes protected by client auth gate + server middleware checking access cookie/token presence (API still enforces RBAC).

---

## 4. Layouts

| Layout | Responsibility |
|--------|----------------|
| Root | Theme tokens, QueryClientProvider, AuthProvider, Toaster |
| Marketing | Minimal nav, brand-forward |
| Shop | Search, category nav, cart-later hook points |
| Try-On | Full-bleed camera stage; minimal chrome; exit confirm |
| Account | Subnav: profile, captures |
| Admin dashboard | Sidebar IA matching modules |

---

## 5. Component Hierarchy

```
Page (Server Component where possible)
└── Feature Container (Client if interactive)
    ├── packages/ui primitives (Button, Dialog, Input…)
    ├── Feature components (ProductGrid, TryOnStage…)
    └── hooks (useProductsQuery, useTryOnSession…)
```

### Try-On hierarchy (critical path)

```
TryOnPage
├── TryOnPermissionGate
├── TryOnToolbar (product title, kind, capture, download)
├── TryOnStage
│   ├── CameraViewport
│   ├── ArEngineHost          # mounts packages/ar-engine
│   ├── TrackingStatusHud     # confidence / FPS (dev or subtle)
│   └── CaptureFlashOverlay
└── TryOnErrorRecovery (retry camera, switch backend, help)
```

**Rule:** No business fetch logic inside `packages/ui`. No Nest imports in frontend.

---

## 6. State Management

| State type | Tool | Examples |
|------------|------|----------|
| Server state | TanStack Query | products, categories, me, captures |
| Auth session | Zustand + memory/local persistence of refresh strategy | access token, user |
| Try-on ephemeral | Zustand (`tryOnStore`) | sessionId, isTracking, lastCaptureId, mirrorOn |
| UI chrome | Zustand/local | sidebar open, filters |

**Query key factory** in `packages/api-client` or `apps/*/src/lib/query-keys.ts`:

```text
products.all(filters)
products.detail(slug)
tryOn.session(id)
captures.mine(page)
```

Mutations invalidate precise keys only.

**Do not** put video frames or landmark arrays in Zustand - keep in engine refs.

---

## 7. Loading Strategy

| Surface | Strategy |
|---------|----------|
| Catalog | SSR/ISR shell + client revalidate; skeleton grids |
| PDP | SSR product + Suspense for related |
| Try-On | Progressive: UI shell -> camera -> model download -> warm-up frames |
| Admin tables | Client Query + skeleton rows; prefetch on hover optional |
| Images | `next/image` + CDN; blur placeholder from admin dimensions |

Model files (TF.js / GLB): lazy dynamic import; show determinate progress when possible.

---

## 8. Error Handling

- Route `error.tsx` boundaries per segment
- API errors mapped via `error.code` -> toast / inline alert
- Camera errors: PermissionDenied, NotFound, NotReadable -> dedicated recovery copy
- AR tracking lost > N ms -> non-blocking banner “Re-center face/hand”
- Global unexpected: log + generic fallback; never blank screen on try-on

---

## 9. Reusable Components (packages/ui + features)

**Design system:** Button, Input, Select, Dialog, Drawer, Tabs, Badge, Avatar, Dropdown, Toast, Form helpers.

**Domain (web):** ProductCard, ProductFilters, PriceText, CategoryChips, CaptureCard, DownloadButton.

**Domain (admin):** DataTable, ImageUploader, AssetUploader, AnchorProfileForm, ConfirmDeleteDialog, PermissionGate.

---

## 10. Reusable Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useAuth` | web/admin | session + login/logout |
| `useProducts` | web | list query |
| `useProduct` | web | detail |
| `useTryOnSession` | web | create/patch session |
| `useCapture` | web | register + download |
| `useCameraPermission` | ar-engine or hooks | permission state |
| `useArEngine` | ar-engine | start/stop/bind canvas |
| `useDebounce` | packages/hooks | filters |

---

## 11. Auth UX Flow

1. Login/register -> store tokens (prefer memory access + secure refresh strategy)
2. api-client intercepts 401 -> refresh -> retry once
3. Admin: redirect to login if `/auth/me` lacks staff role
4. Guest try-on: allowed if public setting; captures may require register to persist gallery

---

## 12. Performance Budgets (targets)

| Metric | Target |
|--------|--------|
| Catalog LCP | < 2.5s on broadband |
| Try-on interactive (camera on) | < 3s after permission |
| Steady try-on FPS | 24-30 on mid mobile |
| Admin TTI | < 3s |

Techniques: code-split try-on route; WASM/model CDN cache; reduce detection resolution under load.

---

## 13. Accessibility & Mobile

- Do not rely on hover-only actions
- Camera CTA large enough for thumbs
- Respect `prefers-reduced-motion` for Framer Motion
- Announce capture success via live region

---

## 14. Parallel Work Boundaries

- Engineer B owns `apps/web` + `packages/ar-engine` + most `packages/ui`
- Engineer A owns admin data tables wired to API; can stub UI with shadcn
- Shared tokens/CSS variables in `packages/ui` - change via small dedicated PRs
