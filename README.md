# GDG College Club Platform

Modern, full-stack community platform for the Google Developer Group (GDG) student club, featuring dynamic 3D visuals, event showcases, member profiles, and authentication with role-based access control (Student & Admin) via Email/Password and Google OAuth.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18 or later
- **npm** or **bun**
- A **Supabase** project instance
- A **Google Cloud Console** OAuth 2.0 Client (for Google Sign-in)

---

### 2. Running Locally

Open two terminal windows to run the frontend and backend concurrently:

#### Terminal 1: Backend Server
```bash
cd GDG-Backend
npm install
npm run dev
```
> Defaults to `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)

#### Terminal 2: Frontend Client
```bash
# In the project root directory
npm install --legacy-peer-deps
npm run dev
```
> Frontend will launch at `http://localhost:8080` (or `http://localhost:8081`)

---

## Authentication & Role Access Guide

### Accessing Auth Pages
- **Sign In**: [`/login`](http://localhost:8080/login) or via the **"Sign In"** button in the header navbar.
- **Sign Up**: [`/signup`](http://localhost:8080/signup) or click **"Create Account"** from the login page.
- **OAuth Callback**: `/auth/callback` handles the identity token exchange and profile synchronization.

---

### Roles & Permissions

The platform strictly enforces role segregation between **Students** and **Administrators**:

| Feature / Role | Student Member | Club Administrator |
| :--- | :--- | :--- |
| **Signup Endpoint** | `POST /api/auth/student/signup` | `POST /api/auth/admin/signup` |
| **Login Endpoint** | `POST /api/auth/student/login` | `POST /api/auth/admin/login` |
| **Required Fields (Signup)** | `Full Name`, `Email`, `Password` | `Full Name`, `Email`, `Password`, **`Admin Verification Code`** |
| **Google OAuth** | One-click instant login | Requires entering the **Admin Verification Code** |
| **Security Lockout** | 5 failed attempts = 15m lockout | 3 failed attempts = 30m lockout |

> [!IMPORTANT]
> ### What is the Admin Verification Code (`ADMIN_SIGNUP_CODE`)?
> The **Admin Verification Code** is a secret key configured in the backend environment (`GDG-Backend/.env`). It ensures that only authorized club leads and coordinators can register as Administrators or link an Admin Google account.
>
> **Where is it set?**
> In `GDG-Backend/.env`:
> ```env
> ADMIN_SIGNUP_CODE=your-secure-admin-signup-secret-code
> ```
> To create an Admin account through the UI, toggle to the **Admin** tab on the signup page and enter the exact code configured in your backend `.env`.

---

## Environment Variables

### Frontend (`.env`)
Create a `.env` file in the root directory (see `.env.example`):
```env
# URL where the backend Express API is running
VITE_API_URL=http://localhost:5000
```

### Backend (`GDG-Backend/.env`)
Create a `.env` file in the `GDG-Backend` directory (see `GDG-Backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:8080

# Secret Key required for Admin registration & Admin Google OAuth
ADMIN_SIGNUP_CODE=your-secure-admin-signup-secret-code

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Google OAuth Credentials (Optional / for direct token refreshes)
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

---

## Supabase & Google Cloud OAuth Setup

### 1. Supabase Dashboard (`https://supabase.com/dashboard`)
1. **URL Configuration** (`Authentication -> URL Configuration`):
   - **Site URL**: `http://localhost:8080`
   - **Redirect URLs**: Add `http://localhost:8080/auth/callback`, `http://localhost:8081/auth/callback`, and `http://localhost:*/auth/callback*`.
2. **Enable Google Provider** (`Authentication -> Providers -> Google`):
   - Enable **Google**, paste your **Google Client ID** and **Client Secret**.
   - Copy the Supabase **Callback URL** (format: `https://<project-ref>.supabase.co/auth/v1/callback`).
3. **Database Migration**:
   - Run the SQL script from `GDG-Backend/supabase/schema.sql` in the Supabase SQL Editor to create the `profiles` table and security policies.

### 2. Google Cloud Console (`https://console.cloud.google.com`)
1. In **APIs & Services > Credentials**, edit your **OAuth 2.0 Client ID**.
2. **Authorized JavaScript origins**: Add `http://localhost:8080`, `http://localhost:8081`, `http://localhost:5000`.
3. **Authorized redirect URIs**: Paste the Supabase Callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`).

---

## Tech Stack
- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand
- **Backend**: Node.js, Express, Supabase Auth & Database (PostgreSQL), Helmet, Rate-Limiters
