# Expense Tracker — Complete Implementation Specification

## 1. Project Overview

Build a full-stack personal expense tracker web application using:

* Frontend: React + Vite
* Styling: Tailwind CSS
* Backend: Node.js + Express.js
* Database: MongoDB
* Authentication: JWT + bcrypt
* API: REST API
* Charts: Recharts
* Icons: Lucide React
* Deployment:

  * Frontend → Vercel
  * Backend → Render
  * Database → MongoDB Atlas

The application should be designed as a real, production-ready portfolio project rather than a simple CRUD demo.

The primary goal is to allow users to:

1. Create an account.
2. Log in securely.
3. Record income and expenses.
4. Organize transactions into categories.
5. Track monthly budgets.
6. Understand spending through charts and reports.
7. Receive useful financial insights.
8. Manage recurring expenses.
9. Export transaction data.
10. Customize application preferences.

---

# 2. Product Vision

The application should not feel like a generic CRUD dashboard.

It should feel like a polished personal finance workspace.

Core product idea:

> Track your money, understand your spending, and make better financial decisions.

The application should prioritize:

* Clarity
* Simplicity
* Fast transaction entry
* Useful visual feedback
* Clean information hierarchy
* Responsive design
* Accessible interactions
* Strong empty/error/loading states
* Consistent design system

---

# 3. Core Architecture

Use this architecture:

```text
                     ┌──────────────────────┐
                     │      React + Vite    │
                     │      Tailwind CSS    │
                     └──────────┬───────────┘
                                │
                                │ REST API + JWT
                                ▼
                     ┌──────────────────────┐
                     │   Node.js + Express  │
                     │                      │
                     │ Routes               │
                     │ Controllers          │
                     │ Middleware           │
                     │ Services             │
                     │ JWT Authentication   │
                     └──────────┬───────────┘
                                │
                                │ Mongoose
                                ▼
                     ┌──────────────────────┐
                     │       MongoDB        │
                     │      / Atlas         │
                     │                      │
                     │ Collections          │
                     │ Indexes              │
                     │ User-owned documents │
                     └──────────────────────┘
```

Important architectural rules:

1. React must NOT directly connect to MongoDB.
2. MongoDB credentials must exist only on the backend.
3. Authentication is handled by Express using bcrypt + JWT.
4. Every protected API request must be authenticated.
5. Every user-owned database query must be scoped to `req.user.userId`.
6. Keep database operations inside services/models rather than React components.

Use:

```text
React → Express API → Mongoose → MongoDB
```

Authentication:

```text
React → Express Auth API → JWT → Protected Express API
```


# 4. Monorepo Structure

Use a single repository:

```text
expense-tracker/
│
├── frontend/
│
├── backend/
│
├── docs/
│
├── .gitignore
├── README.md
└── implementation.md
```

Do not mix frontend and backend source files.

---

# 5. Frontend Technology

Use:

```text
React
Vite
JavaScript
Tailwind CSS
React Router
Axios
Recharts
Lucide React
```

Recommended installation:

```bash
npm install react-router-dom axios recharts lucide-react
```

Do not introduce TypeScript unless explicitly requested later.

Use React functional components and hooks.

Authentication requests must go through the centralized API layer. Do not add MongoDB or Mongoose to the frontend.


# 6. Backend Technology

Use:

```text
Node.js
Express.js
Mongoose
MongoDB
bcryptjs
jsonwebtoken
dotenv
cors
helmet
morgan
```

Recommended packages:

```bash
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet morgan
npm install --save-dev nodemon
```

Use ES modules.

`package.json`:

```json
{
  "type": "module"
}
```

Use Mongoose for schema definition, validation, indexes, and MongoDB access.

Do not install or use a frontend MongoDB client. All database access goes through Express.


# 7. Backend Architecture

Use:

```text
backend/
│
├── src/
│   ├── config/
│   │   ├── env.js
│   │   └── database.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── notFoundMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Category.js
│   │   ├── Expense.js
│   │   ├── Income.js
│   │   ├── Budget.js
│   │   ├── RecurringExpense.js
│   │   └── Notification.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── incomeRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── insightRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── recurringExpenseRoutes.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   ├── incomeController.js
│   │   ├── categoryController.js
│   │   ├── budgetController.js
│   │   ├── dashboardController.js
│   │   ├── reportController.js
│   │   ├── insightController.js
│   │   ├── notificationController.js
│   │   └── recurringExpenseController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── expenseService.js
│   │   ├── incomeService.js
│   │   ├── categoryService.js
│   │   ├── budgetService.js
│   │   ├── dashboardService.js
│   │   ├── reportService.js
│   │   ├── insightService.js
│   │   └── recurringExpenseService.js
│   │
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── validation.js
│   │   ├── jwt.js
│   │   └── response.js
│   │
│   └── server.js
│
├── .env
├── .env.example
├── .gitignore
└── package.json
```

Keep route, controller, service, and database/model responsibilities separated.

Database access must happen in the backend only.

Authentication flow:

```text
React
  ↓
Express API
  ↓
JWT auth middleware
  ↓
Controller
  ↓
Service
  ↓
Mongoose Model
  ↓
MongoDB
```

Do not expose the MongoDB connection string to the frontend.


# 8. Frontend Architecture

Use:

```text
frontend/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   ├── income/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── reports/
│   │   ├── insights/
│   │   ├── notifications/
│   │   └── recurring/
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Income.jsx
│   │   ├── Categories.jsx
│   │   ├── Budgets.jsx
│   │   ├── Reports.jsx
│   │   ├── Insights.jsx
│   │   ├── Notifications.jsx
│   │   ├── RecurringExpenses.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authApi.js
│   │   ├── expenseApi.js
│   │   ├── incomeApi.js
│   │   ├── categoryApi.js
│   │   ├── budgetApi.js
│   │   ├── dashboardApi.js
│   │   ├── reportApi.js
│   │   ├── insightApi.js
│   │   └── notificationApi.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useExpenses.js
│   │   └── useDebounce.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── utils/
│   │   ├── currency.js
│   │   ├── dates.js
│   │   └── validation.js
│   │
│   ├── routes/
│   │   └── ProtectedRoute.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
└── package.json
```

---

# 9. Database Design

Use MongoDB with Mongoose.

MongoDB should use separate collections for the main domain entities:

```text
users
profiles
categories
expenses
income
budgets
recurring_expenses
notifications
```

Use MongoDB `ObjectId` values for document IDs and references.

Relationship strategy:

```text
User
 ├── Profile
 ├── Categories
 ├── Expenses
 ├── Income
 ├── Budgets
 ├── Recurring Expenses
 └── Notifications
```

Store references using `userId` rather than embedding all user-owned records into one large user document. This keeps transaction collections queryable and scalable.

Important rules:

1. Every user-owned document must contain `userId`.
2. The backend must derive `userId` from the verified JWT.
3. Never trust `userId` from request bodies, query parameters, or route parameters.
4. Every query for user-owned data must include the authenticated user's ID.
5. Use Mongoose schemas for validation and indexes.
6. Use MongoDB transactions only where multiple related writes must succeed or fail together.
7. Use `lean()` for read-heavy queries where Mongoose document methods are unnecessary.

---

# 10. Users Collection

Use a `User` model for authentication.

Example Mongoose schema:

```js
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  createdAt: Date,
  updatedAt: Date
}
```

Rules:

```text
email → required, normalized, unique
passwordHash → required, never returned by normal API responses
```

Create a unique index on `email`.

Never store plaintext passwords.

Use `bcryptjs` to hash passwords.

---

# 11. Profiles Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  fullName: String,
  avatarUrl: String,
  currency: String,
  createdAt: Date,
  updatedAt: Date
}
```

Create a unique index on `userId`.

The profile document belongs to exactly one user.

---

# 12. Categories Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId | null,
  name: String,
  icon: String,
  color: String,
  createdAt: Date,
  updatedAt: Date
}
```

`userId = null` may be used for system/default categories.

Users can create their own categories.

Recommended indexes:

```text
{ userId: 1, name: 1 }
{ userId: 1, createdAt: -1 }
```

Category deletion must not corrupt existing expenses. When deleting a category, either set the related expense `categoryId` to `null` or preserve a historical category label according to the application's chosen business rule.

---

# 13. Expenses Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  categoryId: ObjectId | null,
  amount: Number,
  description: String,
  expenseDate: Date,
  paymentMethod: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

Validation:

```text
amount > 0
userId required
expenseDate required
```

Recommended indexes:

```text
{ userId: 1, expenseDate: -1 }
{ userId: 1, categoryId: 1, expenseDate: -1 }
{ userId: 1, createdAt: -1 }
```

For text search, prefer an allowlisted search strategy. If a MongoDB text index is used, define it deliberately rather than creating uncontrolled indexes.

---

# 14. Income Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  amount: Number,
  source: String,
  description: String,
  incomeDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Validation:

```text
amount > 0
source required
incomeDate required
```

Recommended indexes:

```text
{ userId: 1, incomeDate: -1 }
{ userId: 1, createdAt: -1 }
```

---

# 15. Budgets Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  categoryId: ObjectId | null,
  amount: Number,
  month: Number,
  year: Number,
  createdAt: Date,
  updatedAt: Date
}
```

Validation:

```text
amount > 0
month between 1 and 12
year valid
```

A budget may have:

```text
categoryId = null
```

for an overall monthly budget.

Recommended indexes:

```text
{ userId: 1, year: 1, month: 1 }
{ userId: 1, categoryId: 1, year: 1, month: 1 }
```

If the product requires only one budget per user/category/month, enforce an appropriate compound unique index.

---

# 16. Recurring Expenses Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  categoryId: ObjectId | null,
  amount: Number,
  description: String,
  frequency: String,
  nextDate: Date,
  paymentMethod: String,
  active: Boolean,
  lastProcessedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

Supported frequencies:

```text
weekly
monthly
yearly
```

Recommended indexes:

```text
{ userId: 1, active: 1, nextDate: 1 }
{ userId: 1, createdAt: -1 }
```

The recurring-expense processor must be idempotent.

---

# 17. Notifications Collection

Example:

```js
{
  _id: ObjectId,
  userId: ObjectId,
  type: String,
  title: String,
  message: String,
  isRead: Boolean,
  createdAt: Date
}
```

Recommended indexes:

```text
{ userId: 1, isRead: 1, createdAt: -1 }
{ userId: 1, createdAt: -1 }
```

---

# 18. MongoDB Indexes and Data Integrity

Create indexes for commonly queried fields.

At minimum:

```text
users:
  { email: 1 } unique

profiles:
  { userId: 1 } unique

categories:
  { userId: 1, name: 1 }

expenses:
  { userId: 1, expenseDate: -1 }
  { userId: 1, categoryId: 1, expenseDate: -1 }

income:
  { userId: 1, incomeDate: -1 }

budgets:
  { userId: 1, year: 1, month: 1 }

recurring_expenses:
  { userId: 1, active: 1, nextDate: 1 }

notifications:
  { userId: 1, isRead: 1, createdAt: -1 }
```

Do not create unnecessary indexes. Every index has storage and write-performance costs.

MongoDB authorization is enforced by the application layer:

```text
JWT → authenticated userId → query filter { userId }
```

Example:

```js
Expense.find({
  userId: req.user.userId
});
```

For a single record:

```js
Expense.findOne({
  _id: expenseId,
  userId: req.user.userId
});
```

This prevents users from reading or modifying another user's records.

There is no Supabase RLS in this architecture. Backend authorization and query scoping replace that responsibility.


# 19. Authentication Workflow

Use backend-managed JWT authentication.

Passwords must be hashed with `bcryptjs`.

Registration:

```text
Register
    ↓
POST /api/auth/register
    ↓
Validate input
    ↓
Check whether email already exists
    ↓
Hash password with bcrypt
    ↓
Create User
    ↓
Create Profile
    ↓
Create default categories
    ↓
Generate JWT
    ↓
Return authenticated session
    ↓
Dashboard
```

Login:

```text
Login
    ↓
POST /api/auth/login
    ↓
Find user by normalized email
    ↓
Compare password with bcrypt
    ↓
Generate JWT
    ↓
Return token/session
    ↓
Dashboard
```

Logout:

```text
Logout
    ↓
Clear client-side authentication state
    ↓
Login page
```

Recommended JWT payload:

```json
{
  "userId": "USER_OBJECT_ID",
  "email": "user@example.com"
}
```

Do not put sensitive information in the JWT.

Backend middleware:

```text
Authorization: Bearer <token>
        ↓
verify JWT
        ↓
req.user = decoded payload
        ↓
controller/service
```

The backend must reject:

```text
missing token
invalid token
expired token
malformed token
```

Use protected routes for:

```text
/api/profile
/api/expenses
/api/income
/api/categories
/api/budgets
/api/reports
/api/insights
/api/notifications
/api/recurring-expenses
```

Authentication endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Security rules:

1. Never store plaintext passwords.
2. Never return `passwordHash`.
3. Never accept a frontend-supplied `userId` as the source of authorization.
4. Use a strong JWT secret.
5. Set a reasonable JWT expiration.
6. Validate all authentication inputs.
7. Apply rate limiting to authentication endpoints in production.
8. Use HTTPS in production.
9. Consider an HTTP-only secure cookie strategy for production if the application architecture supports it.

Acceptance criteria:

Unauthenticated users cannot access protected API endpoints or protected pages.


# 20. Environment Variables

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

Backend:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Optional production variables:

```env
NODE_ENV=production
COOKIE_SECURE=true
```

Never commit `.env`.

Create `.env.example`.

Never expose:

```text
MONGODB_URI
JWT_SECRET
```

to the frontend.

The frontend should only receive:

```text
VITE_API_URL
```

and other genuinely public configuration values.


# 21. API Design

Base URL:

```text
/api
```

Authentication endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Protected endpoints must require:

```text
Authorization: Bearer <JWT>
```

## Expenses

```text
GET    /api/expenses
GET    /api/expenses/:id
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

Query parameters:

```text
/api/expenses?category=food
/api/expenses?from=2026-09-01&to=2026-09-30
/api/expenses?search=dinner
/api/expenses?sort=amount_desc
```

---

# 22. Expense API Request

POST:

```json
{
  "category_id": 1,
  "amount": 15000,
  "description": "Dinner",
  "expense_date": "2026-09-28",
  "payment_method": "cash",
  "notes": "Dinner with friends"
}
```

Do not allow the frontend to determine `user_id`.

The backend must derive the authenticated user ID.

---

# 23. Income API

```text
GET    /api/income
GET    /api/income/:id
POST   /api/income
PUT    /api/income/:id
DELETE /api/income/:id
```

---

# 24. Categories API

```text
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

---

# 25. Budgets API

```text
GET    /api/budgets
GET    /api/budgets/:id
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
```

Also provide:

```text
GET /api/budgets/progress
```

Return:

```json
{
  "budget": 100000,
  "spent": 72000,
  "remaining": 28000,
  "percentage": 72
}
```

---

# 26. Dashboard API

Create:

```text
GET /api/dashboard/summary
```

Return:

```json
{
  "balance": 250000,
  "totalIncome": 600000,
  "totalExpenses": 350000,
  "monthlyExpenses": 350000,
  "averageDailySpending": 12500,
  "topCategory": {
    "name": "Food",
    "amount": 95000
  }
}
```

Create additional endpoints for chart data if needed.

---

# 27. Reports API

```text
GET /api/reports/monthly
GET /api/reports/categories
GET /api/reports/trends
```

Support:

```text
month
year
date_from
date_to
```

---

# 28. Insights API

```text
GET /api/insights
```

Use rule-based calculations initially.

Examples:

```text
Food spending increased 18% compared with last month.

You have used 82% of your monthly budget.

Transportation is your second-largest category.

Your average daily spending is 12,500 MMK.
```

Do not introduce AI until the rule-based system is working correctly.

---

# 29. Notification API

```text
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

---

# 30. Recurring Expense API

```text
GET    /api/recurring-expenses
POST   /api/recurring-expenses
PUT    /api/recurring-expenses/:id
DELETE /api/recurring-expenses/:id
PATCH  /api/recurring-expenses/:id/toggle
```

---

# 31. API Response Standard

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Expense not found"
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "amount": "Amount must be greater than 0"
  }
}
```

---

# 32. Frontend Pages

Create the following pages.

## Public

```text
/login
/register
```

## Protected

```text
/dashboard
/expenses
/income
/categories
/budgets
/reports
/insights
/notifications
/recurring-expenses
/profile
/settings
```

---

# 33. UI/UX Direction

The design should feel like a modern personal finance workspace.

Avoid:

* Excessive gradients
* Neon colors
* Glassmorphism everywhere
* Huge decorative illustrations
* Excessive shadows
* Overly rounded cards
* Cluttered dashboards

The interface should prioritize information.

---

# 34. Theme

Use a calm, modern financial theme.

Primary:

```text
Deep Navy / Ink
```

Accent:

```text
Teal / Emerald
```

Background:

```text
Warm off-white / very light neutral
```

Positive:

```text
Green
```

Warning:

```text
Amber
```

Danger:

```text
Red
```

Do not use red as a primary brand color.

---

# 35. Color System

Define Tailwind design tokens approximately as:

```text
ink:
#172033

background:
#F7F7F4

surface:
#FFFFFF

border:
#E6E7E2

primary:
#0F766E

primary-light:
#CCFBF1

success:
#15803D

warning:
#B45309

danger:
#DC2626

text:
#172033

muted:
#667085
```

Use colors consistently.

Do not randomly introduce new colors per page.

---

# 36. Typography

Use a clean sans-serif font.

Recommended:

```text
Inter
```

Hierarchy:

```text
Page title: 28–32px
Section title: 20–24px
Card title: 16–18px
Body: 14–16px
Secondary text: 13–14px
```

Avoid oversized typography.

---

# 37. Layout

Desktop:

```text
┌───────────────┬────────────────────────────────┐
│               │                                │
│    Sidebar    │         Main Content           │
│               │                                │
│               │                                │
│               │                                │
└───────────────┴────────────────────────────────┘
```

Sidebar:

```text
Dashboard
Transactions
  Expenses
  Income
  Categories
Budgets
Reports
Insights
Notifications
────────────────
Settings
Profile
Logout
```

On mobile:

```text
Top bar
    ↓
Page content
    ↓
Bottom navigation / mobile menu
```

---

# 38. Dashboard UI

Top:

```text
Good evening, [Name]

Here's your financial overview.
```

Summary cards:

```text
Total Balance
Total Income
Total Expenses
Monthly Spending
```

Then:

```text
Spending Overview
```

Then two-column section:

```text
Spending by Category    Budget Progress
```

Then:

```text
Recent Transactions
```

Then:

```text
Financial Insights
```

---

# 39. Transaction UI

Desktop table:

```text
Date | Description | Category | Payment | Amount | Actions
```

Mobile:

Use transaction cards instead of forcing a wide table.

Each transaction:

```text
Food
Dinner with friends
Today · Cash

15,000 MMK
```

Actions:

```text
Edit
Delete
```

---

# 40. Add Expense Modal

Use a reusable modal.

Fields:

```text
Amount *
Category *
Description
Date *
Payment Method
Notes
```

Buttons:

```text
Cancel
Add Expense
```

Validation:

```text
Amount required
Amount > 0
Category required
Date required
```

After success:

* Close modal
* Refresh transaction list
* Update dashboard
* Show toast

---

# 41. Budget UI

Display:

```text
Food

72,000 / 100,000 MMK

██████████████░░░░

72% used
28,000 remaining
```

Color rules:

```text
< 70% → normal
70–89% → warning
90–99% → danger
>= 100% → exceeded
```

Do not rely only on color. Always include text.

---

# 42. Reports UI

Provide:

```text
Period:
[This Month ▼]
```

Charts:

```text
Monthly Expense Trend
Category Breakdown
Income vs Expenses
```

Use Recharts.

Charts should have:

* Tooltips
* Legends where useful
* Accessible labels
* Empty states
* Responsive sizing

---

# 43. Insights UI

Use simple insight cards:

```text
💡 Spending increased

Your food spending is 18% higher
than last month.
```

```text
⚠ Budget warning

You have used 91% of your
Entertainment budget.
```

```text
✓ Healthy balance

Your income is currently higher
than your expenses this month.
```

Avoid pretending that these are professional financial advice.

Insights should be descriptive, not prescriptive.

---

# 44. Loading States

Every async page must have a loading state.

Use:

```text
Skeleton cards
Skeleton table rows
Spinner for buttons
```

Never leave the screen blank while waiting for an API request.

---

# 45. Empty States

Examples:

Expenses:

```text
No expenses yet.

Start tracking your spending by
adding your first expense.

[Add Expense]
```

Budgets:

```text
No budgets created.

Set a monthly budget to start
tracking your spending.

[Create Budget]
```

Reports:

```text
Not enough data yet.

Add a few transactions to see
your spending trends.
```

---

# 46. Error Handling

Errors must be user-friendly.

Bad:

```text
AxiosError: Request failed with status code 500
```

Good:

```text
Something went wrong while loading your expenses.

[Try Again]
```

For form errors:

```text
Amount must be greater than 0.
```

---

# 47. Toast Notifications

Use toast notifications for actions:

```text
Expense added successfully.

Expense updated successfully.

Expense deleted successfully.

Budget created successfully.
```

Errors:

```text
Unable to save expense.
Please try again.
```

---

# 48. Confirmation Dialogs

Before destructive actions:

```text
Delete this expense?

This action cannot be undone.

[Cancel] [Delete]
```

Do not immediately delete important records without confirmation.

---

# 49. Responsive Design

The application must work on:

```text
Mobile
Tablet
Desktop
Large desktop
```

Breakpoints should use Tailwind defaults unless there is a specific reason to customize them.

Never design desktop first and simply allow horizontal scrolling.

---

# 50. Accessibility

Implement:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Proper button labels
* Form labels
* ARIA labels where needed
* Sufficient contrast
* Do not rely only on color
* Modal keyboard handling
* Escape-to-close dialogs

---

# 51. Phase 1 — Project Setup

Goal:

Create the initial full-stack environment.

Tasks:

1. Create Git repository.
2. Create React/Vite frontend.
3. Create Express backend.
4. Configure Tailwind.
5. Install dependencies.
6. Configure environment variables.
7. Create MongoDB Atlas cluster.
8. Create database.
9. Configure Mongoose and MongoDB connection.
10. Verify frontend and backend communicate.

Acceptance criteria:

```text
React application runs.
Express application runs.
MongoDB connection works.
Environment variables work.
No secrets committed to Git.
```

---

# 52. Phase 2 — Database

Implement:

* profiles
* categories
* expenses
* income
* budgets
* recurring_expenses
* notifications

Then:

* indexes
* backend authorization
* policies
* default categories
* database constraints

Acceptance criteria:

Users cannot access, update, or delete another user's records.

---

# 53. Phase 3 — Authentication

Implement:

* Register
* Login
* Logout
* Session persistence
* Protected routes
* Profile creation

Frontend:

```text
AuthContext
ProtectedRoute
Login
Register
```

Backend:

```text
authMiddleware
authService
JWT utility
bcrypt password hashing
```

Acceptance criteria:

Unauthenticated users cannot access protected pages.

---

# 54. Phase 4 — Application Shell

Build:

* Sidebar
* Topbar
* Mobile navigation
* Page container
* User menu
* Notification indicator
* Theme foundation

Do this before building individual feature pages.

Acceptance criteria:

Every protected page shares the same application shell.

---

# 55. Phase 5 — Expense Management

Implement:

* Expense list
* Add expense
* Edit expense
* Delete expense
* Search
* Category filter
* Date filter
* Payment method filter
* Sorting
* Pagination if necessary

Acceptance criteria:

A user can completely manage their own expenses.

---

# 56. Phase 6 — Income Management

Implement:

* Income list
* Add income
* Edit income
* Delete income
* Search/filter
* Income totals

Acceptance criteria:

Income correctly contributes to balance calculations.

---

# 57. Phase 7 — Categories

Implement:

* View categories
* Create category
* Edit category
* Delete category
* Category spending totals
* Custom icon/color

Do not allow deleting a category to corrupt existing expenses.

Use:

```sql
ON DELETE SET NULL
```

where appropriate.

---

# 58. Phase 8 — Dashboard

Implement:

```text
Total balance
Total income
Total expenses
Monthly expenses
Average daily spending
Top category
Recent transactions
```

Charts:

```text
Spending trend
Category breakdown
Income vs expenses
```

Dashboard should update after transaction changes.

---

# 59. Phase 9 — Budgets

Implement:

* Create budget
* Edit budget
* Delete budget
* Monthly budget
* Category budget
* Progress calculation
* Remaining amount
* Percentage used
* Warning state

Acceptance criteria:

Budget progress updates automatically after expenses are added.

---

# 60. Phase 10 — Reports

Implement:

* Monthly reports
* Yearly reports
* Custom date range
* Category analysis
* Income vs expense
* Spending trends

Add Recharts visualizations.

---

# 61. Phase 11 — Insights

Build a rule-based insight engine.

Rules should analyze:

```text
Month-over-month changes
Budget usage
Largest categories
Daily spending
Income/expense ratio
Unusual high-value transactions
```

Example:

```text
IF current category spending > previous month by 15%
THEN generate spending increase insight.
```

Do not use an external AI API in the initial version.

---

# 62. Phase 12 — Notifications

Implement:

* Budget warnings
* Budget exceeded
* Recurring expense reminders
* Monthly report notification

Add:

```text
Unread count
Mark as read
Mark all as read
```

---

# 63. Phase 13 — Recurring Expenses

Implement:

* Create recurring expense
* Edit
* Delete
* Enable/disable
* Frequency
* Next occurrence
* Automatic generation logic

Supported:

```text
Weekly
Monthly
Yearly
```

Make recurring processing idempotent so the same expense is not generated twice.

---

# 64. Phase 14 — Export

Implement:

```text
Export CSV
```

Include:

```text
Date
Description
Category
Payment Method
Amount
```

PDF export can be added after CSV.

---

# 65. Phase 15 — Settings

Implement:

```text
Profile
Currency
Theme
Date format
Notification preferences
```

Use local storage for purely visual preferences when appropriate.

Store account-related preferences in MongoDB.

---

# 66. Phase 16 — UX Polish

Review every page for:

* Loading states
* Empty states
* Error states
* Toasts
* Confirmation dialogs
* Responsive layout
* Keyboard accessibility
* Mobile layout
* Form validation
* Consistent spacing
* Consistent typography
* Consistent icons
* Consistent buttons

Do not add random UI components merely for decoration.

---

# 67. Phase 17 — Security Review

Verify:

```text
* .env ignored
* No secret keys in frontend
* MongoDB connection string only on backend
* JWT secret only on backend
* Passwords stored only as bcrypt hashes
* Authentication required for protected API routes
* Users can only access their own data
* Backend validates authenticated user
* API validates request data
* CORS configured
* Helmet enabled
* Rate limiting configured for auth endpoints in production
* No sensitive information in error messages
* MongoDB queries are scoped by authenticated userId
* Destructive actions require confirmation
```

Security tests must explicitly verify that changing an object ID cannot bypass user ownership checks.

Never rely on frontend route protection alone. Backend authorization is mandatory.


# 68. Phase 18 — Performance

Optimize:

* Dashboard queries
* Database indexes
* Large transaction lists
* Chart rendering
* API calls
* React unnecessary re-renders

Avoid making many independent API requests when one aggregated endpoint can provide the dashboard data.

---

# 69. Phase 19 — Testing

Test backend:

```text
Auth
Expenses
Income
Categories
Budgets
Reports
Notifications
```

Test frontend:

```text
Login
Register
Protected routes
Forms
CRUD
Filters
Charts
Responsive layout
Error states
```

Important security tests:

```text
User A cannot access User B's expense.

User A cannot update User B's expense.

User A cannot delete User B's expense.

User A cannot manipulate user_id to access another user's data.
```

---

# 70. Phase 20 — Deployment

## MongoDB Atlas

Use MongoDB Atlas for the production database unless a self-hosted MongoDB deployment is intentionally chosen.

Configure:

```text
Database user
Network access
Database name
Application connection string
Indexes
```

Security:

```text
Do not allow unrestricted database access in production.
Use least-privilege database credentials.
Keep MONGODB_URI in backend environment variables.
```

Before deployment, verify:

```text
MongoDB connection succeeds.
Indexes exist.
Authentication works.
User isolation works.
Production database is not using development credentials.
```

---

## Backend

Deploy Express to Render.

Environment variables:

```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=
PORT=
NODE_ENV=production
```

Configure:

```text
npm start
```

Health endpoint:

```text
GET /health
```

Return:

```json
{
  "status": "ok"
}
```

The health endpoint should verify that the application process is running. A separate protected/internal database health check may be used if needed.

---

## Frontend

Deploy React to Vercel.

Environment:

```env
VITE_API_URL=
```

Configure SPA routing so direct navigation to routes works correctly.

The frontend must never contain:

```text
MONGODB_URI
JWT_SECRET
```


# 71. Production Workflow

Final user workflow:

```text
User
 │
 ▼
Landing Page
 │
 ├── Login
 │
 └── Register
       │
       ▼
   JWT Authentication
       │
       ▼
    Dashboard
       │
       ├── Add Expense
       │       ↓
       │   Express API
       │       ↓
       │   MongoDB
       │
       ├── Add Income
       │
       ├── Budgets
       │
       ├── Reports
       │
       ├── Insights
       │
       └── Settings
```

---

# 72. Important Development Rules

## Rule 1 — Do not over-engineer early

Implement the MVP before advanced features.

Order:

```text
Auth
↓
Expenses
↓
Income
↓
Categories
↓
Dashboard
↓
Budgets
↓
Reports
↓
Insights
↓
Advanced features
```

---

## Rule 2 — Reuse components

Do not create duplicate components.

For example:

```text
Modal
Button
Input
Select
DatePicker
Card
Table
EmptyState
LoadingState
ConfirmDialog
Toast
```

should be reusable.

---

## Rule 3 — Reuse API patterns

All API calls should use a centralized Axios instance.

Example:

```text
services/api.js
```

Configure:

```text
baseURL
Authorization
error handling
```

---

## Rule 4 — Never trust frontend user IDs

The backend must determine the authenticated user.

Never trust:

```json
{
  "user_id": "..."
}
```

from the frontend.

---

## Rule 5 — Keep business logic out of React components

Bad:

```text
Dashboard.jsx
    ↓
200 lines of calculations
    ↓
API calls
    ↓
formatting
    ↓
business rules
```

Prefer:

```text
Dashboard.jsx
    ↓
dashboardApi
    ↓
backend service
```

---

# MongoDB Implementation Notes

This project intentionally uses MongoDB instead of a relational database.

Do not recreate the old SQL tables or RLS policies. Translate those concepts into:

```text
SQL table              → MongoDB collection
SQL row                → MongoDB document
foreign key            → ObjectId reference
RLS                    → backend authorization + userId query scoping
SQL index              → MongoDB index
database constraint    → Mongoose validation / application validation
JWT Authentication          → bcrypt + JWT authentication
```

For reporting and dashboard aggregation, use MongoDB aggregation pipelines where appropriate. Keep aggregation logic inside backend services.

For financial amounts, avoid unsafe floating-point calculations where precision matters. Consider storing the smallest currency unit as an integer (for example, MMK whole units) or using MongoDB Decimal128 if the product later requires fractional monetary values. Keep the representation consistent across the application.

# 73. Definition of Done

The project is considered complete when:

### Authentication

* [ ] Register works
* [ ] Login works
* [ ] Logout works
* [ ] Sessions persist
* [ ] Protected routes work

### Expenses

* [ ] Create
* [ ] Read
* [ ] Update
* [ ] Delete
* [ ] Search
* [ ] Filter
* [ ] Sort

### Income

* [ ] Create
* [ ] Read
* [ ] Update
* [ ] Delete

### Categories

* [ ] Default categories
* [ ] Custom categories
* [ ] Edit
* [ ] Delete
* [ ] Category analytics

### Dashboard

* [ ] Balance
* [ ] Income
* [ ] Expenses
* [ ] Recent transactions
* [ ] Charts
* [ ] Category breakdown

### Budgets

* [ ] Create
* [ ] Edit
* [ ] Delete
* [ ] Progress
* [ ] Warning states

### Reports

* [ ] Monthly
* [ ] Yearly
* [ ] Custom range
* [ ] Charts

### Insights

* [ ] Rule-based insights
* [ ] Spending comparison
* [ ] Budget warnings

### Advanced

* [ ] Notifications
* [ ] Recurring expenses
* [ ] CSV export
* [ ] Settings
* [ ] Dark mode

### Production

* [ ] backend authorization verified
* [ ] Security reviewed
* [ ] Responsive
* [ ] Error handling
* [ ] Loading states
* [ ] Deployed frontend
* [ ] Deployed backend
* [ ] Production MongoDB database
* [ ] README completed

---

# 74. Cursor Agent Implementation Rules

When implementing this project with Cursor Agent:

1. Read `implementation.md` completely before making architectural changes.
2. Follow the current phase only.
3. Do not skip database/security requirements.
4. Do not introduce a different framework without approval.
5. Do not replace MongoDB with another database.
6. Do not replace Express with another backend framework.
7. Use React functional components.
8. Use Tailwind CSS for styling.
9. Keep frontend and backend separated.
10. Reuse components instead of duplicating code.
11. Keep API logic outside page components.
12. Keep business logic outside UI components.
13. Validate all user input.
14. Never expose secret credentials.
15. Respect MongoDB backend authorization.
16. Never trust a frontend-supplied user ID.
17. Handle loading, empty, success, and error states.
18. Maintain responsive behavior.
19. Do not redesign existing pages unnecessarily when implementing a new feature.
20. Before modifying architecture, inspect the existing codebase.
21. Preserve working functionality when adding features.
22. Do not create mock APIs once the real backend endpoint exists.
23. Remove temporary mock data after connecting real APIs.
24. Do not leave TODO placeholders for core functionality.
25. After each phase, verify the application still builds and runs.

---

# 75. Cursor Execution Strategy

Implement the project incrementally.

For each phase:

```text
1. Inspect existing code.
2. Identify affected files.
3. Implement backend/database changes.
4. Implement frontend changes.
5. Connect frontend to backend.
6. Add loading/error/empty states.
7. Test the feature.
8. Fix regressions.
9. Verify build.
10. Summarize completed changes.
```

Do not attempt to implement the entire application in one uncontrolled generation.

Each phase should produce a working application.

---

# 76. Final Product Structure

The final application should provide:

```text
                    EXPENSE TRACKER
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    TRANSACTIONS       PLANNING          ANALYTICS
        │                 │                 │
    Expenses            Budgets           Reports
    Income              Recurring         Charts
    Categories          Alerts            Insights
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                     DASHBOARD
                          │
                     USER ACCOUNT
                          │
                JWT Authenticationentication
```

The finished application should feel cohesive rather than like a collection of independent CRUD pages.

The dashboard should be the central place where transaction data, budgets, reports, and insights come together.

---

# 77. Final Priority Order

If time becomes limited, prioritize in this exact order:

```text
P0 — Must Have
────────────────────────
Authentication
Database
backend authorization
Expenses
Categories
Dashboard
Income


P1 — Important
────────────────────────
Budgets
Reports
Charts
Search
Filters
Responsive UI
Error/loading states


P2 — Portfolio Features
────────────────────────
Insights
Notifications
Recurring expenses
CSV export
Dark mode


P3 — Optional
────────────────────────
PDF export
Advanced analytics
AI-generated summaries
Multiple currencies
Advanced notification automation
```

Never sacrifice authentication security, backend authorization, data integrity, or basic usability in order to add advanced features.
