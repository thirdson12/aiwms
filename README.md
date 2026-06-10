# AIWMS — Accounting, Inventory & Work Management

Web-based system with role-based auth, job management, **inventory & stock transactions**, and **Turkish/English UI**.

## Stack

- **Frontend:** Next.js 15, Tailwind CSS, custom i18n (TR default + EN)
- **Backend:** NestJS, Passport JWT
- **Database:** PostgreSQL, Prisma
- **Monorepo:** Turborepo + pnpm workspaces
- **Infra:** Docker Compose (PostgreSQL), Render (production)

## Deploy to Render

GitHub + Render ile canlı test için **[DEPLOY.md](./DEPLOY.md)** dosyasına bakın.

Özet: repo'yu GitHub'a push edin → Render'da **Blueprint** ile `render.yaml` deploy edin.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for PostgreSQL)

## Quick start

```bash
cd C:\Users\esegu\Projects\aiwms
copy .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Demo accounts

All seeded users use password **`password123`**:

| Email | Role |
|---|---|
| admin@aiwms.local | Admin |
| owner@aiwms.local | Owner |
| worker1@aiwms.local | Worker |
| worker2@aiwms.local | Worker |

## Languages

Default UI language is **Turkish (tr)**. Switch to English in **Settings** or on the login page.

Message files: `apps/web/messages/tr.json`, `apps/web/messages/en.json`

## Phase 2 — Inventory

- **Products:** name, SKU, unit, quantity on hand, minimum stock level
- **Stock transactions:** stock in, stock out, adjustment (with audit trail)
- **Permissions:** Admin/Owner manage inventory; Workers can view
- **Dashboard:** total products + low-stock alerts

### Inventory API

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List products |
| GET | `/products/:id` | Product detail |
| POST | `/products` | Create product (Admin/Owner) |
| PATCH | `/products/:id` | Update product (Admin/Owner) |
| DELETE | `/products/:id` | Deactivate product (Admin/Owner) |
| GET | `/products/:id/transactions` | Stock movement history |
| POST | `/products/:id/transactions` | Record stock movement (Admin/Owner) |

## All API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh tokens |
| GET | `/auth/me` | Current user |
| GET/POST/PATCH/DELETE | `/users` | User management |
| GET/PATCH | `/users/profile` | Profile & password |
| GET/POST/PATCH/DELETE | `/jobs` | Job management |
| GET/POST/PATCH/DELETE | `/products` | Inventory (Phase 2) |
| GET | `/dashboard` | Role-aware stats |

## Phase 2 smoke test

- [ ] Dashboard shows **Toplam Ürün** and **Düşük Stok** counts (Turkish default)
- [ ] **Envanter** nav item lists seeded products (Çelik Vida M8, Ahşap Panel, etc.)
- [ ] Owner can create a product and record stock in/out
- [ ] Low-stock badge appears when quantity ≤ minimum level
- [ ] Worker sees inventory read-only (no create/adjust buttons)
- [ ] Language switcher in Settings toggles UI to English
- [ ] Dates format as `tr-TR` or `en-US` based on locale

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run web + API in dev mode |
| `pnpm build` | Build all packages |
| `pnpm db:migrate` | Apply Prisma migrations (dev) |
| `pnpm db:migrate:deploy` | Apply migrations (production/CI) |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |

## Phase 3 — Accounting, Customers & WhatsApp

- **Customers:** name, phone, email, notes; linked to jobs and debts
- **Accounting:** expenses, incomes, debt tracking with payments
- **Debt visibility:** borç durumu shown on **Jobs**, **Muhasebe**, and **Müşteriler** lists
- **WhatsApp templates:** prepare messages such as *"Aracınız teslim edilmeye hazır"* and open `wa.me` link
- **Permissions:** Admin/Owner manage; Workers can view

### Phase 3 API

| Method | Path | Description |
|---|---|---|
| GET/POST/PATCH/DELETE | `/customers` | Customer CRUD |
| GET | `/accounting/summary` | Net balance, open/overdue debts |
| GET/POST | `/accounting/expenses` | Expense records |
| GET/POST | `/accounting/incomes` | Income records |
| GET/POST | `/accounting/debts` | Debt records |
| POST | `/accounting/debts/:id/pay` | Record debt payment |
| GET | `/whatsapp/templates` | Message templates (TR/EN) |
| POST | `/whatsapp/templates/:key/render` | Render message + WhatsApp URL |

### Phase 3 smoke test

- [ ] **Müşteriler** lists customers with borç durumu badges
- [ ] Customer detail shows **WhatsApp Mesajı** composer; *Aracınız teslim edilmeye hazır* template works
- [ ] **Muhasebe** shows summary cards, customer debt table, and debts tab with status
- [ ] **İşler** list shows müşteri + borç columns; job detail links customer and WhatsApp composer
- [ ] Owner can add expense, income, debt, and record payment

## Phase 4 — Reporting

- **Financial report:** income, expenses, net balance, debt collections by date range
- **Jobs report:** status breakdown, completion rate, performance by worker
- **Inventory report:** low stock list, movement summary, recent transactions
- **Debt report:** customer debt status, overdue list, total collected
- **CSV export:** Admin/Owner can download reports (UTF-8 CSV)

### Phase 4 API

| Method | Path | Description |
|---|---|---|
| GET | `/reports/financial?from=&to=` | Financial report for date range |
| GET | `/reports/jobs?from=&to=` | Jobs report (worker-scoped for workers) |
| GET | `/reports/inventory` | Inventory report |
| GET | `/reports/debts` | Debt report |
| GET | `/reports/export/:type?from=&to=` | CSV export (Admin/Owner) |

### Phase 4 smoke test

- [ ] **Raporlar** nav opens overview with links to sub-reports
- [ ] Financial report filters by date range and shows monthly breakdown
- [ ] Jobs report shows status badges and worker table
- [ ] Inventory report lists low-stock products and recent movements
- [ ] Debt report shows customer debts and overdue list
- [ ] Owner can export financial report as CSV

## Next phases

- **Phase 5:** Barcode, e-invoice, multi-branch
"# aiwms" 
