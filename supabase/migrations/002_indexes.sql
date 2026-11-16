-- ==============================================================================
-- BYTECGLOBAL / BYTECCLOUD — 002_indexes.sql
-- Performance and Foreign Key Indexes for Supabase PostgreSQL
-- ==============================================================================

-- Admin Users & Auth Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users (status);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens (expires_at);

-- Contacts & Leads Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts (assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads (contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads (stage);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- Clients & Projects Indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects (priority);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_order ON project_tasks (display_order);

-- Meetings Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings (status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings (meeting_date, meeting_time);
CREATE INDEX IF NOT EXISTS idx_meetings_client_email ON meetings (LOWER(client_email));

-- Emails & Automations Indexes
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails (LOWER(recipient_email));
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails (status);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations (trigger_event);
CREATE INDEX IF NOT EXISTS idx_automations_enabled ON automations (enabled);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON automation_logs (automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_logs (timestamp DESC);

-- CMS Indexes
CREATE INDEX IF NOT EXISTS idx_cms_services_slug ON cms_services (slug);
CREATE INDEX IF NOT EXISTS idx_cms_services_order ON cms_services (display_order);
CREATE INDEX IF NOT EXISTS idx_cms_services_visibility ON cms_services (visibility);

CREATE INDEX IF NOT EXISTS idx_cms_solutions_order ON cms_solutions (display_order);
CREATE INDEX IF NOT EXISTS idx_cms_solutions_visibility ON cms_solutions (visibility);

CREATE INDEX IF NOT EXISTS idx_cms_projects_slug ON cms_projects (slug);
CREATE INDEX IF NOT EXISTS idx_cms_projects_order ON cms_projects (display_order);
CREATE INDEX IF NOT EXISTS idx_cms_projects_featured ON cms_projects (featured);
CREATE INDEX IF NOT EXISTS idx_cms_projects_visibility ON cms_projects (visibility);

CREATE INDEX IF NOT EXISTS idx_cms_technologies_order ON cms_technologies (display_order);
CREATE INDEX IF NOT EXISTS idx_cms_technologies_visibility ON cms_technologies (visibility);

CREATE INDEX IF NOT EXISTS idx_cms_navigation_order ON cms_navigation (display_order);
CREATE INDEX IF NOT EXISTS idx_cms_navigation_visibility ON cms_navigation (visibility);

-- Analytics & Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_last_visit ON visitors (last_visit DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON analytics_events (path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events (timestamp DESC);

-- Notifications & Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs (admin_id);

-- Testimonials & Media Indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials (status);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials (featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials (display_order);

CREATE INDEX IF NOT EXISTS idx_media_category ON media (category);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media (created_at DESC);
