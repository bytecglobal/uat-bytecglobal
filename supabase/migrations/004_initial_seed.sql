-- ==============================================================================
-- BYTECGLOBAL / BYTECCLOUD — 004_initial_seed.sql
-- Idempotent Default Seed Data (CMS Defaults, System Settings, Templates)
-- Strictly NO fake contacts, leads, clients, projects, meetings, visitors.
-- ==============================================================================

-- 1. Default CMS Sections
INSERT INTO cms_sections (id, data, visibility)
VALUES
  ('homepage', '{
    "categoryText": "Software · AI · Cloud · Data",
    "mainHeading": "Your digital transformation",
    "highlightedHeading": "partner.",
    "description": "We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools, built around how your business really works.",
    "primaryButtonText": "Let''s talk",
    "primaryButtonUrl": "/start-project",
    "secondaryButtonText": "See our work",
    "secondaryButtonUrl": "/projects",
    "tags": ["100% custom-built", "Web, mobile, AI & cloud under one roof"],
    "visibility": true
  }'::jsonb, true),
  ('heroAnimation', '{
    "enabled": true,
    "particleCount": 160,
    "particleSize": 3,
    "animationSpeed": 1,
    "visibility": true,
    "behavior": "interactive-orbit"
  }'::jsonb, true),
  ('about', '{
    "heading": "Engineering Digital Excellence for Forward-Thinking Enterprises",
    "subheading": "Custom solutions crafted around how your business really operates.",
    "content": "BytecGlobal is a premier technology partner specializing in enterprise custom software, cloud architecture, and artificial intelligence solutions. We replace manual friction with seamless, reliable software.",
    "visibility": true
  }'::jsonb, true),
  ('branding', '{
    "name": "BytecGlobal",
    "tagline": "Your digital transformation partner.",
    "primaryColor": "#f5c518",
    "accentInk": "#806000",
    "darkBackground": "#29251b",
    "logoText": "BytecGlobal",
    "contactEmail": "bytecglobal@gmail.com",
    "location": "India",
    "visibility": true
  }'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Default CMS Footer
INSERT INTO cms_footer (id, brand_description, contact_email, meeting_url, meeting_label, admin_login_link, copyright_text, company_links, social_links, visibility)
VALUES (
  'main',
  'Software, AI and cloud engineering for ambitious businesses.',
  'bytecglobal@gmail.com',
  'https://calendly.com/team-bytecglobal/30min',
  'Book a Meeting',
  '{"label": "Admin Login", "url": "/admin/login", "enabled": true, "displayOrder": 2, "showLockIcon": true}'::jsonb,
  '© 2026 BytecGlobal. All rights reserved.',
  '[
    {"label": "About", "href": "/about", "enabled": true},
    {"label": "How we work", "href": "/how-we-work", "enabled": true},
    {"label": "Projects", "href": "/projects", "enabled": true},
    {"label": "Technologies", "href": "/technologies", "enabled": true},
    {"label": "Contact", "href": "/contact", "enabled": true}
  ]'::jsonb,
  '[
    {"platform": "LinkedIn", "url": "https://linkedin.com", "enabled": true},
    {"platform": "GitHub", "url": "https://github.com", "enabled": true}
  ]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Default Email Templates
INSERT INTO email_templates (id, name, category, subject, content, placeholders)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Inquiry Confirmation Email', 'Inquiry Confirmation',
   'Thank you for contacting BytecGlobal - We have received your inquiry',
   'Hello {{customer_name}},\n\nThank you for reaching out to BytecGlobal. We have received your project details regarding {{service_name}}.\n\nOur solutions engineering team is reviewing your requirements and will reach back out within 24 business hours.\n\nWarm regards,\nThe BytecGlobal Team\nhttps://bytecglobal.com',
   '["customer_name", "customer_email", "service_name", "company_name"]'::jsonb),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Meeting Confirmation Email', 'Meeting Confirmation',
   'Meeting Confirmed: BytecGlobal Discovery Call on {{meeting_date}}',
   'Hi {{customer_name}},\n\nYour discovery meeting with BytecGlobal has been confirmed for {{meeting_date}}.\n\nMeeting link: {{meeting_link}}\n\nWe look forward to speaking with you!\n\nBest,\nBytecGlobal Engineering Team',
   '["customer_name", "meeting_date", "meeting_link"]'::jsonb),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Lead Follow-up Email', 'Follow-up',
   'Following up on your digital transformation project',
   'Hi {{customer_name}},\n\nI wanted to follow up on your recent inquiry regarding {{service_name}} for {{company_name}}.\n\nDo you have 15 minutes this week for a quick consultation?\n\nBest regards,\nBytecGlobal Team',
   '["customer_name", "service_name", "company_name"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Default System Settings
INSERT INTO system_settings (id, general, security, integrations)
VALUES (
  'default',
  '{
    "siteName": "BytecGlobal",
    "supportEmail": "bytecglobal@gmail.com",
    "timezone": "Asia/Kolkata",
    "dateFormat": "YYYY-MM-DD",
    "maintenanceMode": false
  }'::jsonb,
  '{
    "maxLoginAttempts": 5,
    "lockoutDurationMinutes": 15,
    "sessionExpiryHours": 24,
    "enforceStrongPasswords": true
  }'::jsonb,
  '{
    "calendly": {
      "configured": true,
      "status": "Connected (Default Meeting Link)"
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 5. Default Automations
INSERT INTO automations (id, name, trigger_event, description, enabled, actions, execution_count)
VALUES
  ('b2c3d4e5-0001-4000-8000-000000000001', 'New Contact Inquiry Workflow', 'contact_submit',
   'Automatically saves inquiry, creates lead, dispatches confirmation, and alerts admins.', true,
   '[
     {"type": "save_inquiry", "params": {}},
     {"type": "create_lead", "params": {}},
     {"type": "notify_admin", "params": {"channel": "in_app"}},
     {"type": "send_template_email", "params": {"templateId": "a1b2c3d4-0001-4000-8000-000000000001"}}
   ]'::jsonb, 0),
  ('b2c3d4e5-0002-4000-8000-000000000002', 'New Meeting Scheduled Workflow', 'meeting_booked',
   'Logs meeting, sends calendar invite reference, and creates follow-up task.', true,
   '[
     {"type": "save_meeting", "params": {}},
     {"type": "notify_admin", "params": {"channel": "in_app"}}
   ]'::jsonb, 0)
ON CONFLICT (id) DO NOTHING;

-- 6. Default Global SEO Settings
INSERT INTO seo_settings (id, is_global, path, title, description, metadata)
VALUES
  ('global', true, NULL,
   'BytecGlobal | Custom Software, AI & Cloud Engineering',
   'BytecGlobal builds enterprise custom software, web platforms, mobile apps, and AI solutions tailored to operational business needs.',
   '{
     "siteName": "BytecGlobal",
     "titleTemplate": "%s | BytecGlobal - Engineering Digital Excellence",
     "canonicalBase": "https://bytecglobal.com",
     "robots": "index, follow",
     "ogImage": "/og-image.png"
   }'::jsonb),
  ('page_home', false, '/',
   'BytecGlobal — Digital Transformation & Custom Software',
   'We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools.',
   '{}'::jsonb),
  ('page_about', false, '/about',
   'About Us — BytecGlobal',
   'Learn about BytecGlobal''s philosophy, engineering standards, and mission to deliver exceptional digital platforms.',
   '{}'::jsonb),
  ('page_services', false, '/services',
   'Services — BytecGlobal Engineering Solutions',
   'Full-cycle software engineering: Web, Mobile, AI/ML, Data Science, and Cloud DevOps.',
   '{}'::jsonb),
  ('page_solutions', false, '/solutions',
   'Enterprise Solutions — BytecGlobal',
   'From custom ERPs to intelligent automation workflows, explore our end-to-end business solutions.',
   '{}'::jsonb),
  ('page_projects', false, '/projects',
   'Client Work & Case Studies — BytecGlobal',
   'Explore real enterprise software, mobile apps, and automated dashboards engineered by BytecGlobal.',
   '{}'::jsonb),
  ('page_technologies', false, '/technologies',
   'Technology Stack — BytecGlobal',
   'Our modern tech stack: React, Next.js, Node.js, Python, PostgreSQL, AWS, and modern AI models.',
   '{}'::jsonb),
  ('page_contact', false, '/contact',
   'Contact Us — BytecGlobal',
   'Connect with our engineering leadership to discuss your project requirements or book a consultation.',
   '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
