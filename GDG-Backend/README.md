# College Club Backend API

A production-ready Node.js + Express backend service for a college club web application, powered by [Supabase](https://supabase.com/) for authentication and PostgreSQL database management with Row Level Security (RLS) and Audit Activity Logging.

---

## 🛠 Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Database & Auth:** Supabase (`@supabase/supabase-js`, PostgreSQL with RLS)
- **Integrations:** Google Calendar API, Google OAuth Identity Linking
- **Security & Logging:** Audit Activity Logging with IP and Geolocation resolution
- **Configuration & Utilities:** `dotenv`, `cors`
- **Testing:** Jest, Supertest

---

## 🚀 Supabase & Google Cloud Setup Guide

### 1. Database Schema & RLS Policies
1. Log in to your [Supabase Dashboard](https://app.supabase.com/).
2. Open the **SQL Editor** tab on the left sidebar.
3. Paste the contents of [`supabase/schema.sql`](file:///c:/Antigravity%20Projects/GDG-Backend/supabase/schema.sql) and click **Run**.
4. This script sets up:
   - `public.profiles` (with flexible JSONB `details` column)
   - `public.events` (with flexible JSONB `details` column)
   - `public.forms` (with dynamic JSONB `schema` column)
   - `public.form_submissions` (with dynamic JSONB `answers` column)
   - `public.user_google_tokens` (for secure calendar token storage and refresh)
   - `public.activity_logs` (for comprehensive audit trail with IP & Geolocation)
   - Complete Row Level Security (RLS) policies across all tables.

### 2. Email Auth Settings
1. In Supabase Dashboard, navigate to **Authentication** -> **Providers** -> **Email**.
2. Ensure **Email provider** is enabled.
3. For local testing without confirmation emails, toggle **"Confirm email"** to **OFF**.

### 3. Google Cloud OAuth & Calendar Setup for Supabase
To enable Google Login and Google Calendar reminders:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Navigate to **APIs & Services** -> **Library**, search for **Google Calendar API**, and click **Enable**.
4. Navigate to **APIs & Services** -> **OAuth consent screen**:
   - Choose **External** user type (or **Internal** if only for college domain).
   - Add scopes: `https://www.googleapis.com/auth/calendar.events` and `https://www.googleapis.com/auth/calendar`.
   - Add test user email addresses if in testing mode.
5. Navigate to **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth Client ID**:
   - Application Type: **Web application**.
   - **Authorized redirect URIs**: Add your Supabase Auth callback URL:
     ```
     https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
     ```
6. Copy the **Client ID** and **Client Secret**.
7. In **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**:
   - Toggle **Enable Google provider** to **ON**.
   - Paste your **Client ID** and **Client Secret**.
   - In **Scopes**, add: `https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar`
   - Click **Save**.

---

## 💻 Local Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Required for Admin account creation
ADMIN_SIGNUP_CODE=your-secure-admin-signup-secret-code

SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Optional: For direct backend token refresh
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

### 3. Run Application & Tests
- **Development Server:** `npm run dev`
- **Production Server:** `npm start`
- **Run Automated Test Suite:** `npm test`

---

## 🔒 Security Architecture & Notes

> [!IMPORTANT]
> **Admin Signup Protection (`ADMIN_SIGNUP_CODE`):**
> Creating an admin account (via either **Email+Password** or **Google OAuth**) requires providing a valid `admin_code` matching the `ADMIN_SIGNUP_CODE` environment variable. Student signups are unaffected.

> [!NOTE]
> **Audit Activity Logging:**
> User actions (logins, failed logins, signups, logouts, event management, form management, submissions) are automatically recorded to `public.activity_logs` with client IP, Geolocation (city/region/country), User-Agent, and action context. Geolocation handles localhost/private IPs gracefully and operates in a non-blocking manner.

---

## 📖 Complete API Reference

All protected endpoints require the HTTP header:
```http
Authorization: Bearer <access_token>
```

---

### 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/student/signup` | Public | Register new student account (role: `'student'`) |
| `POST` | `/api/auth/admin/signup` | Protected by Code | Register new admin account (requires `admin_code`) |
| `POST` | `/api/auth/student/login` | Public | Login student (rejects admins with `403`) |
| `POST` | `/api/auth/admin/login` | Public | Login admin (rejects students with `403`) |
| `POST` | `/api/auth/logout` | Authenticated | Logout user and record activity log |
| `GET` | `/api/auth/google/url` | Public | Generates Google OAuth URL (requires `admin_code` if `role=admin`) |
| `POST` | `/api/auth/google/sync-profile` | Authenticated | Syncs profile & saves tokens (requires `admin_code` if `role=admin`) |
| `GET` | `/api/auth/google/link` | Authenticated | Generates Google account link URL for existing email users |
| `POST` | `/api/auth/google/tokens` | Authenticated | Saves Google OAuth tokens after linking |
| `GET` | `/api/auth/google/status` | Authenticated | Checks if user has an active Google Calendar link |

---

### 2. Events Management (`/api/events`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/events` | Authenticated | List all club events (students & admins) |
| `GET` | `/api/events/:id` | Authenticated | Get single event by ID |
| `POST` | `/api/events` | Admin Only | Create event with flexible JSONB `details` (logs `event_created`) |
| `PUT` | `/api/events/:id` | Admin Only | Update event title or JSONB `details` (logs `event_updated`) |
| `DELETE` | `/api/events/:id` | Admin Only | Delete event (logs `event_deleted`) |
| `POST` | `/api/events/:eventId/calendar-reminder` | Authenticated | Create Google Calendar reminder (branching flow) |

---

### 3. Dynamic Forms per Event (`/api/forms`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/forms` | Admin Only | Create form linked to `event_id` with JSONB `schema` (logs `form_created`) |
| `GET` | `/api/events/:eventId/forms` | Authenticated | List all forms for an event |
| `GET` | `/api/forms/:id` | Authenticated | Get form details & schema |
| `PUT` | `/api/forms/:id` | Admin Only | Update form schema or title (logs `form_updated`) |
| `DELETE` | `/api/forms/:id` | Admin Only | Delete form (logs `form_deleted`) |
| `POST` | `/api/forms/:formId/submissions` | Authenticated / Students | Submit answers with strict schema validation (logs `form_submitted`) |
| `GET` | `/api/forms/:formId/submissions` | Admin Only | View all student submissions for a form |
| `GET` | `/api/forms/submissions/my` | Authenticated | View own submitted forms |

---

### 4. Admin Audit Logs (`/api/admin/logs`)

Accessible by **Admins Only** (`role === 'admin'`).

- **Endpoint:** `GET /api/admin/logs`
- **Query Parameters:**
  - `page` (number, default: 1): Page number for pagination.
  - `limit` (number, default: 20, max: 100): Results per page.
  - `user_id` (UUID, optional): Filter logs by specific user ID.
  - `action` (string, optional): Filter by action (e.g. `login`, `login_failed`, `signup`, `event_created`, `form_created`).
  - `from` / `start_date` (ISO date, optional): Filter logs created after this timestamp.
  - `to` / `end_date` (ISO date, optional): Filter logs created before this timestamp.
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Activity logs retrieved successfully.",
    "total": 42,
    "page": 1,
    "limit": 20,
    "logs": [
      {
        "id": "c1a93e50-9ef2-48fb-976a-54bc2937e091",
        "user_id": "c7a86f78-687f-4318-97e3-0d3fb0671607",
        "action": "event_created",
        "details": {
          "event_id": "7832ef8a-2c09-43c7-95bc-7d43f65721a9",
          "title": "Google Cloud & AI Hackathon 2026"
        },
        "ip_address": "203.0.113.195",
        "location": {
          "city": "Bengaluru",
          "region": "Karnataka",
          "country": "India"
        },
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "created_at": "2026-08-19T13:30:00.000Z"
      }
    ]
  }
  ```

---

### 5. Common User Dashboard (`/api/dashboard`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Authenticated | Get current user's profile and JSONB `details` |
| `PUT` | `/api/dashboard` | Authenticated | Update user's own profile and JSONB `details` |
