# BytecGlobal — Supabase PostgreSQL Architecture & Deployment Guide

This directory contains database migrations, security policies, and seeding scripts for BytecGlobal on Supabase PostgreSQL.

---

## 1. Directory Structure

```text
supabase/
  migrations/
    001_initial_schema.sql  # 29 normalized relational tables, constraints & triggers
    002_indexes.sql         # High-performance query and foreign-key indexes
    003_rls_policies.sql    # Mandatory Row Level Security (RLS) on all tables
    004_initial_seed.sql    # Idempotent default CMS content, templates & system settings
  seed.js                   # Node.js script for safe initial Super Admin initialization
  README.md                 # Setup and operational instructions
```

---

## 2. Setup Instructions

### Step 1: Create a Supabase Project
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and name it `BytecGlobal`.
3. Choose your preferred region and generate a strong database password.
4. Once provisioned, navigate to **Project Settings -> API** to retrieve:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY` *(Server-only!)*

### Step 2: Apply Migrations
Execute the SQL migrations in order via the Supabase SQL Editor:
1. `001_initial_schema.sql`
2. `002_indexes.sql`
3. `003_rls_policies.sql`
4. `004_initial_seed.sql`

*(Alternatively, if using the Supabase CLI: `supabase db push`)*

### Step 3: Create Media Storage Bucket
1. Go to **Storage -> New Bucket** in the Supabase Dashboard.
2. Name the bucket: `bytecglobal-media`.
3. Toggle **Public Bucket** to ON (so images and company assets are accessible to website visitors).
4. Under **Storage Policies**, ensure authenticated/service-role admins can upload/delete, while the public has read access:
   - Public Read: `SELECT` allowed for all.
   - Admin Write: `INSERT`, `UPDATE`, `DELETE` allowed for service role.

### Step 4: Initialize Super Admin
Set the following in `.env.local` or environment:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INITIAL_ADMIN_EMAIL=admin@bytecglobal.com
INITIAL_ADMIN_PASSWORD=YourStrongPasswordHere
```
Then run:
```bash
node supabase/seed.js
```

---

## 3. Row Level Security (RLS) Policy Verification

All 29 application tables have RLS enabled.

| Table Category | Public Access | Privileged Admin Access |
|---|---|---|
| Published CMS (`cms_sections`, `cms_services`, etc.) | Read-Only (WHERE `visibility = true`) | Full CRUD via Server-side Admin Client |
| Sensitive Records (`contacts`, `leads`, `clients`, `projects`, etc.) | **DENIED** | Full CRUD via Server-side Admin Client |
| Auth & Audit (`admin_users`, `admin_sessions`, `audit_logs`) | **DENIED** | Privileged Server-side operations only |
| Testimonials | Read-Only (WHERE `status = 'published'`) | Full CRUD via Server-side Admin Client |
| Newsletter | INSERT with email check | Full CRUD via Server-side Admin Client |
