# System Architecture — Sari-Sari (Customer Credit Ledger Management System)

**Model:** Single-owner store. No branches, no staff role. The owner signs
up, and that same account manages products, customers, checkout, and
payments.

---

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React + Vite | SPA, no SSR |
| UI components | shadcn/ui | Radix + Tailwind, copy-in components |
| Styling | Tailwind CSS | Installed as part of shadcn init |
| Icons | lucide-react | Ships with shadcn init |
| Notifications | sonner | Toasts for add/edit/delete actions |
| Forms & validation | react-hook-form + zod | Pairs with shadcn Form component |
| Backend | Supabase | Postgres database, Auth, Row-Level Security |
| Barcode scanning | @zxing/browser or html5-qrcode | Local camera decoding, no external API |
| Hosting | Vercel | Static SPA build, connected to GitHub for auto-deploy |

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    A[Browser<br/>React + Vite + shadcn/ui] -->|Auth requests| B[Supabase Auth<br/>signup, login, reset password]
    A -->|CRUD queries| C[Supabase Postgres<br/>Row-Level Security by store_id]
    A -->|Camera input| D[Local barcode decode<br/>zxing / html5-qrcode]
    D -->|barcode value| A
    E[Vercel] -->|serves static build| A
```

**How it fits together:**
- **Vercel** builds and serves the compiled React app. Because it's a
  single-page app, `vercel.json` must include a rewrite so client-side
  routes don't 404 on refresh:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- **Supabase Auth** handles signup, login, and password reset — no custom
  auth backend needed.
- **Supabase Postgres** stores all app data, scoped per store using
  Row-Level Security so one owner never sees another owner's data.
- **Barcode scanning** happens entirely in the browser via the device
  camera. It only reads a barcode string and looks it up in your own
  `products` table — no external product-database API is called.

---

## 3. System Flow

```mermaid
flowchart TD
    S1[Owner signs up] --> S2[System creates a store<br/>owner becomes admin]
    S2 --> S3[Owner adds products<br/>name, barcode, price]
    S3 --> S4[Daily checkout:<br/>select customer, scan barcode]
    S4 --> S5[Price auto-filled from products table]
    S5 --> S6[Transaction saved as utang<br/>customer balance increases]
    S6 --> S7[Customer pays later]
    S7 --> S8[Payment recorded<br/>customer balance decreases]
    S8 --> S9[Owner reviews dashboard<br/>outstanding totals, sales, top debtors]
```

---

## 4. Database Schema (simplified, single-owner)

```mermaid
erDiagram
    STORES ||--|| USERS : "owned by"
    STORES ||--o{ PRODUCTS : has
    STORES ||--o{ CUSTOMERS : has
    STORES ||--o{ TRANSACTIONS : has
    CUSTOMERS ||--o{ TRANSACTIONS : makes
    CUSTOMERS ||--o{ PAYMENTS : makes
    TRANSACTIONS ||--o{ TRANSACTION_ITEMS : contains
    PRODUCTS ||--o{ TRANSACTION_ITEMS : "referenced in"

    STORES {
        uuid id PK
        uuid owner_id FK
        string name
        timestamp created_at
    }
    USERS {
        uuid id PK
        string email
        string role
    }
    PRODUCTS {
        uuid id PK
        uuid store_id FK
        string name
        string barcode
        numeric base_price
    }
    CUSTOMERS {
        uuid id PK
        uuid store_id FK
        string name
        string contact
        numeric balance
    }
    TRANSACTIONS {
        uuid id PK
        uuid store_id FK
        uuid customer_id FK
        numeric total
        timestamp created_at
    }
    TRANSACTION_ITEMS {
        uuid id PK
        uuid transaction_id FK
        uuid product_id FK
        int quantity
        numeric unit_price
    }
    PAYMENTS {
        uuid id PK
        uuid customer_id FK
        numeric amount
        timestamp created_at
    }
```

No `branches` table, no `branch_id` anywhere, no `invites` table — a
single `store_id` is the only scoping key used across Row-Level Security
policies.

**Example RLS policy pattern (products table):**
```sql
create policy "Owners can only see their own products"
on products for select
using (store_id = (select id from stores where owner_id = auth.uid()));
```

---

## 5. Auth Flow

```mermaid
flowchart TD
    A[Owner visits site] --> B{Has account?}
    B -- No --> C[Sign up: email + password]
    C --> D[Supabase Auth creates user]
    D --> E[App creates a store row<br/>owner_id = new user id]
    B -- Yes --> F[Log in: email + password]
    F --> G[Supabase session established]
    G --> H[App loads owner's store data]
    B -- Forgot password --> I[resetPasswordForEmail]
    I --> J[Owner receives reset link via email]
    J --> K[Owner sets new password]
```

---

## 6. Admin Features

**Dashboard**
- Outstanding total — total utang balance
- Today's sales
- Total customers
- Top debtors — customers with the highest unpaid balance
- Sales trend — last 7–30 days
- Recent activity — latest transactions and payments

**Other features**
- Products — add/edit product catalog (name, barcode, base price)
- Customers — view all customer accounts and balances
- Checkout — scan barcode, select/add customer, save as utang
- Ledger — full history of utang entries
- Payments — record and view payment history
- Reports — sales and outstanding balance summaries
- Store settings — store name/branding, account settings, password change

---

## 7. Suggested Folder Structure

```
src/
├── components/
│   ├── ui/              # shadcn components (generated)
│   ├── AdminSidebar.jsx
│   ├── AdminDashboard.jsx
│   ├── ProductsPage.jsx
│   ├── CustomersPage.jsx
│   ├── CheckoutPage.jsx
│   ├── LedgerPage.jsx
│   ├── PaymentsPage.jsx
│   ├── ReportsPage.jsx
│   └── SettingsPage.jsx
├── lib/
│   ├── supabaseClient.js
│   └── utils.js          # e.g. peso formatter
├── hooks/
│   └── useAuth.js
├── routes/
│   └── AppRoutes.jsx
├── App.jsx
└── main.jsx
```

---

## 8. Deployment

1. Push repo to GitHub.
2. Connect the repo to a new Vercel project.
3. Set environment variables in Vercel: `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`.
4. Add `vercel.json` rewrite rule (see Section 2) for SPA routing.
5. Every push to the main branch auto-deploys.