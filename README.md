# Shivom Construction ERP — Building Material Supply

A fast, modern, and production-ready web-based ERP system built specifically for **Shivom Construction — Building Material Supply**. Designed to be lightweight and intuitive for counter billing staff while maintaining double-entry accounting integrity, atomic inventory decrements, and comprehensive Indian GST compliance.

![Shivom Construction ERP](/images/shivom-logo.png)

---

## 🚀 Key Features

### 1. High-Speed Express POS & Counter Billing
- Instant product search across thousands of hardware SKUs with keyboard shortcuts.
- Real-time stock decrement upon confirmed sale (`Current Stock - Sold Quantity`).
- Automatic GST breakdown (CGST, SGST, IGST) based on customer state vs. company location.
- Multi-mode payment support: Cash, UPI, Bank Transfer, Credit.
- Professional printable GST Tax Invoice (A4 formatted) with print and WhatsApp share features.

### 2. Construction Inventory & Multi-Godown Management
- Standard hardware unit support: `BAG`, `TON`, `KG`, `METER`, `FEET`, `LITRE`, `PCS`, `BOX`, `SET`, `DOZEN`.
- Complete stock movement audit trails recording every inbound purchase, sale deduction, and variance adjustment.
- Minimum stock level alerts and replenishment notifications.
- Stock variance adjustment module with authorized reason tracking.
- Multi-warehouse / godown tracking (e.g. *Main Godown*, *Site Yard #2*).

### 3. Business & Accounts
- **Customer & Supplier Master:** Credit limits, opening balance, live outstanding balances, and running ledgers.
- **Quotation Management:** Fast quoting system with 1-click conversion to confirmed sale invoices.
- **Receivables & Payables:** Aging views of customer dues and supplier liabilities.
- **Cash & Bank:** Real-time ledger tracking cash drawer, bank accounts, and UPI transactions.
- **Expenses:** Categorized expense register.

### 4. Indian GST & Compliance Reports
- GSTR-1 and GSTR-3B ready data tables.
- HSN summary tables with CGST, SGST, and IGST breakdowns.
- Daily/Monthly sales, purchase, stock valuation, and gross profit reports.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 with custom brand tokens (Shivom Construction Orange `#e16718` & Charcoal `#24282c`)
- **Database:** PostgreSQL (Neon Serverless Cloud)
- **ORM:** Prisma ORM 6.19
- **Authentication & Security:** Role-Based Access Control (RBAC), bcryptjs password hashing

---

## 👥 User Roles & Demo Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `admin@shivomconstruction.com` | `admin123` | Full system access, all modules, financial reports, settings, and user management. |
| **Sales / Billing** | `billing@shivomconstruction.com` | `billing123` | Express POS, quotations, invoices, payments received, customer outstanding, customer ledger. |
| **Store / Purchase** | `store@shivomconstruction.com` | `store123` | Inventory, products, categories, stock adjustments, godowns, purchase orders, goods inward. |

---

## ⚡ Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- PostgreSQL database URL

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aadviksolutions/Shivom-ERP.git
   cd Shivom-ERP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
   JWT_SECRET="your-secret-key"
   NEXTAUTH_SECRET="your-session-secret"
   NEXT_PUBLIC_APP_NAME="Shivom Construction"
   ```

4. **Sync Prisma Database Schema & Seed Data:**
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub (`https://github.com/aadviksolutions/Shivom-ERP`).
2. Import the project into [Vercel](https://vercel.com/new).
3. Set the following Environment Variables in Vercel Project Settings:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: Random 32+ character string.
   - `NEXTAUTH_SECRET`: Random 32+ character string.
   - `NEXT_PUBLIC_APP_NAME`: `Shivom Construction`
4. Deploy! Vercel automatically runs `prisma generate` during `postinstall` and builds the Next.js production bundle.

---

## 📄 License
Proprietary — Shivom Construction — Building Material Supply.
