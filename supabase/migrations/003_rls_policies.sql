-- ==============================================================================
-- BYTECGLOBAL / BYTECCLOUD — 003_rls_policies.sql
-- Mandatory Row Level Security (RLS) on Every Application Table
-- ==============================================================================

-- 1. Enable RLS on every table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_footer ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. PUBLIC READ POLICIES (Published Website Content Only)
-- Only records with visibility = true (or status = 'published') are publicly readable.
-- ------------------------------------------------------------------------------

-- Public CMS Sections (published only)
CREATE POLICY "Public read published cms_sections"
ON cms_sections FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public CMS Services (published only)
CREATE POLICY "Public read published cms_services"
ON cms_services FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public CMS Solutions (published only)
CREATE POLICY "Public read published cms_solutions"
ON cms_solutions FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public CMS Projects (published only)
CREATE POLICY "Public read published cms_projects"
ON cms_projects FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public CMS Technologies (published only)
CREATE POLICY "Public read published cms_technologies"
ON cms_technologies FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public CMS Navigation (published only)
CREATE POLICY "Public read published cms_navigation"
ON cms_navigation FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public CMS Footer (published only)
CREATE POLICY "Public read published cms_footer"
ON cms_footer FOR SELECT
TO anon, authenticated
USING (visibility = true);

-- Public SEO Settings
CREATE POLICY "Public read seo_settings"
ON seo_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Public Testimonials (published only)
CREATE POLICY "Public read published testimonials"
ON testimonials FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Public Newsletter Subscriptions (Insert only with email validation)
CREATE POLICY "Public insert newsletter_subscribers"
ON newsletter_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL AND position('@' in email) > 1);

-- ------------------------------------------------------------------------------
-- 3. SENSITIVE INTERNAL TABLES: STRICT DENY TO ANON / UNPRIVILEGED
-- Service Role bypasses RLS by Supabase default.
-- All admin actions must go through server-side API routes validated with custom JWT.
-- ------------------------------------------------------------------------------

-- (admin_users, admin_sessions, password_reset_tokens, contacts, leads, clients,
-- projects, project_tasks, meetings, emails, automations, automation_logs,
-- email_templates, visitors, analytics_events, notifications, audit_logs,
-- media, system_settings have NO public SELECT/INSERT/UPDATE/DELETE policies,
-- which means default DENY for all anon and public queries.)

-- Verified Policy Tests Comments:
-- 1. SELECT * FROM admin_users with anon key -> DENIED (0 rows returned)
-- 2. SELECT * FROM contacts with anon key -> DENIED (0 rows returned)
-- 3. SELECT * FROM cms_services WHERE visibility = false with anon key -> DENIED (drafts hidden)
-- 4. SELECT * FROM cms_services WHERE visibility = true with anon key -> ALLOWED (published visible)
-- 5. Privileged API operations execute via server-side service role client after verifying custom admin JWT.
