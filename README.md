# SponsorLink

Sponsorship management for Devonport Tennis Club. Public sponsorship form and admin area for viewing sponsors.

## Setup

1. Copy `env.example` to `.env` and set:
   - **DATABASE_URL** – Postgres connection string (e.g. [Neon](https://neon.tech) free tier, works on Vercel).
   - **ADMIN_SESSION_SECRET** – Random string (at least 16 characters) for signing admin session cookies.

2. On first use, the app creates `sponsors` and `admin_users` tables and a default admin user:
   - **Username:** `admin`
   - **Password:** `DTC@dmin`  
   Change the password after first login via **Admin → Change password**.

## Admin

- **URL:** `/admin`
- **Login:** `/admin/login` (default credentials above).
- **Dashboard:** List of all sponsor submissions from the sponsorship form.
- **Change password:** `/admin/change-password` (requires login).

## Tech

- Next.js 15 (App Router), Neon serverless Postgres, session-based admin auth (HTTP-only cookie).
- Vercel-friendly: serverless-compatible DB and no long-lived connections.
