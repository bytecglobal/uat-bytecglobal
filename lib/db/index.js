import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SITE, SERVICES, SOLUTIONS, PROJECTS, TECH, NAV } from "@/lib/site";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const BACKUPS_DIR = path.join(process.cwd(), "data", "backups");

// In-memory cache & write lock to prevent race conditions during concurrent server requests
let dbCache = null;
let isWriting = false;
const writeQueue = [];

function ensureDataDirectories() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

/**
 * Returns clean default database structure seeded with existing BytecGlobal content
 */
function createInitialDatabase() {
  const salt = bcrypt.genSaltSync(10);
  const defaultAdminPasswordHash = bcrypt.hashSync("BytecAdmin@2025!", salt);
  const now = new Date().toISOString();

  return {
    meta: {
      version: "1.0.0",
      createdAt: now,
      updatedAt: now,
    },
    users: [
      {
        id: "usr_superadmin",
        name: "Bytec Super Admin",
        email: "admin@bytecglobal.com",
        passwordHash: defaultAdminPasswordHash,
        role: "SUPER_ADMIN", // SUPER_ADMIN, ADMIN, EDITOR, MANAGER
        status: "active",
        createdAt: now,
        lastLogin: null,
        failedAttempts: 0,
        lockoutUntil: null,
      },
    ],
    sessions: [],
    visitors: [],
    analytics_events: [],
    contacts: [
      {
        id: "cnt_welcome_demo",
        name: "Demo Enterprise Client",
        email: "client@example.com",
        phone: "+1 555-0199",
        companyName: "Acme Logistics Corp",
        service: "Software Development",
        subject: "Enterprise ERP Ingestion & Custom Cloud Platform",
        message: "We are interested in modernizing our inventory system and replacing legacy Excel sheets with a web-based portal.",
        budget: "$25,000 - $50,000",
        timeline: "2-3 months",
        sourcePage: "/start-project",
        status: "qualified", // new, contacted, qualified, meeting_scheduled, proposal_sent, converted, lost, archived
        assignedTo: "usr_superadmin",
        notes: [
          {
            id: "note_1",
            author: "Bytec Super Admin",
            text: "Initial inquiry reviewed. Fits our core custom ERP modernization competency.",
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    leads: [
      {
        id: "lead_welcome_demo",
        contactId: "cnt_welcome_demo",
        name: "Demo Enterprise Client",
        email: "client@example.com",
        phone: "+1 555-0199",
        companyName: "Acme Logistics Corp",
        service: "Software Development",
        stage: "qualified", // new, contacted, qualified, proposal_sent, won, lost
        estimatedValue: 35000,
        source: "Website Contact Form",
        assignedTo: "usr_superadmin",
        notes: [
          {
            id: "lead_note_1",
            author: "Bytec Super Admin",
            text: "Proposal preparation underway.",
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    clients: [
      {
        id: "cli_1",
        name: "RetailEdge Inc.",
        contactPerson: "Marcus Vance",
        email: "contact@retailedge.io",
        phone: "+1 800-555-0143",
        industry: "Retail & E-commerce",
        status: "active",
        totalValue: 48000,
        notes: "Streamlined inventory management and customer portal.",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cli_2",
        name: "BuildRight Contractors",
        contactPerson: "Sarah Jenkins",
        email: "operations@buildright.com",
        phone: "+1 888-555-0182",
        industry: "Construction",
        status: "active",
        totalValue: 32000,
        notes: "Field service mobile app for job tracking.",
        createdAt: now,
        updatedAt: now,
      },
    ],
    projects: [
      {
        id: "prj_1",
        title: "Inventory & Orders ERP",
        clientId: "cli_1",
        clientName: "RetailEdge Inc.",
        category: "Software Development",
        description: "A custom ERP that replaced spreadsheets for a multi-branch distributor with real-time stock sync.",
        startDate: "2026-01-15",
        deadline: "2026-04-30",
        budget: 48000,
        priority: "high",
        status: "in_progress", // planning, pending, in_progress, on_hold, completed, cancelled
        progress: 75,
        assignedTeam: ["Bytec Super Admin"],
        tasks: [
          { id: "tsk_1", title: "Database schema & multi-tenant auth", completed: true },
          { id: "tsk_2", title: "Real-time stock ledger & branch sync", completed: true },
          { id: "tsk_3", title: "Automated invoice generator", completed: false },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prj_2",
        title: "Field Service Mobile App",
        clientId: "cli_2",
        clientName: "BuildRight Contractors",
        category: "Mobile App Development",
        description: "An offline-first app syncing jobs, photos, and signatures to a manager dashboard.",
        startDate: "2026-02-01",
        deadline: "2026-05-15",
        budget: 32000,
        priority: "medium",
        status: "in_progress",
        progress: 60,
        assignedTeam: ["Bytec Super Admin"],
        tasks: [
          { id: "tsk_4", title: "Offline SQLite sync queue", completed: true },
          { id: "tsk_5", title: "Photo upload & GPS stamping", completed: true },
          { id: "tsk_6", title: "Manager review portal", completed: false },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    meetings: [
      {
        id: "mtg_demo",
        clientName: "Marcus Vance",
        clientEmail: "contact@retailedge.io",
        title: "ERP Phase 2 Milestone Review",
        date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        time: "15:00",
        durationMinutes: 45,
        status: "confirmed", // requested, confirmed, rescheduled, completed, cancelled
        meetingLink: "https://calendly.com/team-bytecglobal/30min",
        notes: "Reviewing invoice generator milestones and testing API endpoints.",
        source: "calendly",
        createdAt: now,
        updatedAt: now,
      },
    ],
    emails: [
      {
        id: "eml_demo",
        to: "client@example.com",
        from: "BytecCloud Inquiries <inquiries@bytecglobal.com>",
        subject: "Thank you for reaching out to BytecGlobal",
        category: "Inquiry Confirmation",
        status: "sent", // draft, sent, failed
        providerResponse: "Delivered via Resend REST Engine",
        sentAt: now,
        createdAt: now,
      },
    ],
    automations: [
      {
        id: "aut_inquiry",
        name: "New Contact Inquiry Workflow",
        trigger: "contact_submit",
        description: "Automatically saves inquiry, creates lead, dispatches confirmation, and alerts admins.",
        enabled: true,
        actions: [
          { type: "save_inquiry", params: {} },
          { type: "create_lead", params: {} },
          { type: "notify_admin", params: { channel: "in_app" } },
          { type: "send_template_email", params: { templateId: "tpl_inquiry_confirmation" } },
        ],
        executionCount: 1,
        lastRunAt: now,
        createdAt: now,
      },
      {
        id: "aut_meeting",
        name: "New Meeting Scheduled Workflow",
        trigger: "meeting_booked",
        description: "Logs meeting, sends calendar invite reference, and creates follow-up task.",
        enabled: true,
        actions: [
          { type: "save_meeting", params: {} },
          { type: "notify_admin", params: { channel: "in_app" } },
        ],
        executionCount: 1,
        lastRunAt: now,
        createdAt: now,
      },
    ],
    automation_logs: [
      {
        id: "log_aut_init",
        automationId: "aut_inquiry",
        automationName: "New Contact Inquiry Workflow",
        trigger: "system_init",
        status: "success",
        details: "Automations engine initialized and active.",
        timestamp: now,
      },
    ],
    templates: [
      {
        id: "tpl_inquiry_confirmation",
        name: "Inquiry Confirmation Email",
        category: "Inquiry Confirmation",
        subject: "Thank you for contacting BytecGlobal - We have received your inquiry",
        content: `Hello {{customer_name}},\n\nThank you for reaching out to BytecGlobal. We have received your project details regarding {{service_name}}.\n\nOur solutions engineering team is reviewing your requirements and will reach back out within 24 business hours.\n\nWarm regards,\nThe BytecGlobal Team\nhttps://bytecglobal.com`,
        placeholders: ["customer_name", "customer_email", "service_name", "company_name"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "tpl_meeting_confirmation",
        name: "Meeting Confirmation Email",
        category: "Meeting Confirmation",
        subject: "Meeting Confirmed: BytecGlobal Discovery Call on {{meeting_date}}",
        content: `Hi {{customer_name}},\n\nYour discovery meeting with BytecGlobal has been confirmed for {{meeting_date}}.\n\nMeeting link: {{meeting_link}}\n\nWe look forward to speaking with you!\n\nBest,\nBytecGlobal Engineering Team`,
        placeholders: ["customer_name", "meeting_date", "meeting_link"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "tpl_followup",
        name: "Lead Follow-up Email",
        category: "Follow-up",
        subject: "Following up on your digital transformation project",
        content: `Hi {{customer_name}},\n\nI wanted to follow up on your recent inquiry regarding {{service_name}} for {{company_name}}.\n\nDo you have 15 minutes this week for a quick consultation?\n\nBest regards,\nBytecGlobal Team`,
        placeholders: ["customer_name", "service_name", "company_name"],
        createdAt: now,
        updatedAt: now,
      },
    ],
    cms_sections: {
      homepage: {
        categoryText: "Software · AI · Cloud · Data",
        mainHeading: "Your digital transformation",
        highlightedHeading: "partner.",
        description: "We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools, built around how your business really works.",
        primaryButtonText: "Let's talk",
        primaryButtonUrl: "/start-project",
        secondaryButtonText: "See our work",
        secondaryButtonUrl: "/projects",
        tags: ["100% custom-built", "Web, mobile, AI & cloud under one roof"],
        visibility: true,
        updatedAt: now,
        publishedAt: now,
      },
      heroAnimation: {
        enabled: true,
        particleCount: 160,
        particleSize: 3,
        animationSpeed: 1,
        visibility: true,
        behavior: "interactive-orbit",
        updatedAt: now,
        publishedAt: now,
      },
      about: {
        heading: "Engineering Digital Excellence for Forward-Thinking Enterprises",
        subheading: "Custom solutions crafted around how your business really operates.",
        content: "BytecGlobal is a premier technology partner specializing in enterprise custom software, cloud architecture, and artificial intelligence solutions. We replace manual friction with seamless, reliable software.",
        visibility: true,
        updatedAt: now,
        publishedAt: now,
      },
      branding: {
        name: SITE.name,
        tagline: "Your digital transformation partner.",
        primaryColor: "#f5c518",
        accentInk: "#806000",
        darkBackground: "#29251b",
        logoText: "BytecGlobal",
        contactEmail: "bytecglobal@gmail.com",
        contactPhone: "+00 000 000 0000",
        location: "India",
        visibility: true,
        updatedAt: now,
        publishedAt: now,
      },
    },
    cms_services: SERVICES.map((srv, index) => ({
      id: `srv_${srv.slug}`,
      slug: srv.slug,
      title: srv.title,
      tagline: srv.tagline,
      sectionTitle: srv.sectionTitle,
      sectionIntro: srv.sectionIntro,
      short: srv.short,
      points: srv.points,
      tech: srv.tech || [],
      process: srv.process,
      whoWeWorkWith: srv.whoWeWorkWith,
      faqs: srv.faqs,
      finalCTA: srv.finalCTA,
      displayOrder: index + 1,
      visibility: true,
      updatedAt: now,
      publishedAt: now,
    })),
    cms_solutions: SOLUTIONS.map((sol, index) => ({
      id: `sol_${index + 1}`,
      title: sol.title,
      text: sol.text,
      displayOrder: index + 1,
      visibility: true,
      updatedAt: now,
      publishedAt: now,
    })),
    cms_projects: PROJECTS.map((prj, index) => ({
      id: `prj_${prj.slug}`,
      slug: prj.slug,
      title: prj.title,
      tag: prj.tag,
      summary: prj.summary,
      challenge: prj.challenge,
      solution: prj.solution,
      results: prj.results,
      stack: prj.stack,
      featured: true,
      displayOrder: index + 1,
      visibility: true,
      updatedAt: now,
      publishedAt: now,
    })),
    cms_technologies: TECH.map((t, index) => ({
      id: `tech_${index + 1}`,
      group: t.group,
      items: t.items,
      displayOrder: index + 1,
      visibility: true,
      updatedAt: now,
      publishedAt: now,
    })),
    cms_navigation: NAV.map((item, index) => ({
      id: `nav_${index + 1}`,
      label: item.label,
      href: item.href,
      dropdown: Boolean(item.dropdown),
      displayOrder: index + 1,
      visibility: true,
      updatedAt: now,
      publishedAt: now,
    })),
    cms_footer: {
      brandDescription: "Software, AI and cloud engineering for ambitious businesses.",
      contactEmail: "bytecglobal@gmail.com",
      meetingUrl: "https://calendly.com/team-bytecglobal/30min",
      meetingLabel: "Book a Meeting",
      // Important: Footer Admin Login link configuration
      adminLoginLink: {
        label: "Admin Login",
        url: "/admin/login",
        enabled: true,
        displayOrder: 2, // Placed directly below the Book a Meeting button
        showLockIcon: true,
      },
      copyrightText: `© ${new Date().getFullYear()} BytecGlobal. All rights reserved.`,
      companyLinks: [
        { label: "About", href: "/about", enabled: true },
        { label: "How we work", href: "/how-we-work", enabled: true },
        { label: "Projects", href: "/projects", enabled: true },
        { label: "Technologies", href: "/technologies", enabled: true },
        { label: "Contact", href: "/contact", enabled: true },
      ],
      socialLinks: [
        { platform: "LinkedIn", url: "https://linkedin.com", enabled: true },
        { platform: "GitHub", url: "https://github.com", enabled: true },
      ],
      visibility: true,
      updatedAt: now,
      publishedAt: now,
    },
    seo_settings: {
      global: {
        siteName: "BytecGlobal",
        titleTemplate: "%s | BytecGlobal - Engineering Digital Excellence",
        defaultTitle: "BytecGlobal | Custom Software, AI & Cloud Engineering",
        defaultDescription: "BytecGlobal builds enterprise custom software, web platforms, mobile apps, and AI solutions tailored to operational business needs.",
        canonicalBase: "https://bytecglobal.com",
        robots: "index, follow",
        ogImage: "/og-image.png",
      },
      pages: {
        "/": {
          title: "BytecGlobal — Digital Transformation & Custom Software",
          description: "We turn spreadsheets, paper forms and manual follow-ups into custom software, web platforms, mobile apps and AI tools.",
        },
        "/about": {
          title: "About Us — BytecGlobal",
          description: "Learn about BytecGlobal's philosophy, engineering standards, and mission to deliver exceptional digital platforms.",
        },
        "/services": {
          title: "Services — BytecGlobal Engineering Solutions",
          description: "Full-cycle software engineering: Web, Mobile, AI/ML, Data Science, and Cloud DevOps.",
        },
        "/solutions": {
          title: "Enterprise Solutions — BytecGlobal",
          description: "From custom ERPs to intelligent automation workflows, explore our end-to-end business solutions.",
        },
        "/projects": {
          title: "Client Work & Case Studies — BytecGlobal",
          description: "Explore real enterprise software, mobile apps, and automated dashboards engineered by BytecGlobal.",
        },
        "/technologies": {
          title: "Technology Stack — BytecGlobal",
          description: "Our modern tech stack: React, Next.js, Node.js, Python, PostgreSQL, AWS, and modern AI models.",
        },
        "/contact": {
          title: "Contact Us — BytecGlobal",
          description: "Connect with our engineering leadership to discuss your project requirements or book a consultation.",
        },
      },
    },
    media: [
      {
        id: "med_sample_logo",
        filename: "bytec-logo.svg",
        originalName: "bytec-logo.svg",
        mimeType: "image/svg+xml",
        size: 4210,
        path: "/uploads/bytec-logo.svg",
        category: "branding",
        altText: "BytecGlobal Corporate Logo",
        createdAt: now,
      },
    ],
    notifications: [
      {
        id: "notif_welcome",
        title: "Enterprise Admin Panel Ready",
        message: "BytecGlobal Enterprise Admin Panel & CMS initialized with full RBAC, Visitor Tracking, and CMS engine.",
        category: "security",
        read: false,
        link: "/admin/dashboard",
        createdAt: now,
      },
    ],
    whatsapp_settings: {
      phoneNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
      defaultMessage: "Hello BytecGlobal team, I would like to inquire about your software and engineering services.",
      enabled: true,
      position: "bottom-right",
      clickCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    testimonials: [
      {
        id: "rev_1",
        clientName: "David Sterling",
        companyName: "Nexus Global Supply",
        designation: "Chief Operating Officer",
        reviewText: "BytecGlobal replaced our disjointed spreadsheets with a clean, ultra-responsive ERP system. Our order turnaround time dropped by 65%.",
        rating: 5,
        clientImage: null,
        featured: true,
        status: "published",
        createdAt: now,
      },
      {
        id: "rev_2",
        clientName: "Elena Rodriguez",
        companyName: "Vertex Logistics",
        designation: "VP of Product",
        reviewText: "The offline-first mobile app engineered by BytecGlobal is flawless. Our field technicians love it and data syncs seamlessly to headquarters.",
        rating: 5,
        clientImage: null,
        featured: true,
        status: "published",
        createdAt: now,
      },
    ],
    newsletter: [
      {
        id: "sub_1",
        email: "techlead@partner-corp.com",
        status: "subscribed",
        campaignsReceived: 1,
        subscribedAt: now,
      },
    ],
    audit_logs: [
      {
        id: "aud_init",
        adminId: "usr_superadmin",
        adminEmail: "admin@bytecglobal.com",
        action: "SYSTEM_INITIALIZATION",
        module: "SYSTEM",
        recordId: "system",
        ip: "127.0.0.1",
        details: "BytecGlobal Enterprise Admin & CMS initial database seeded successfully.",
        result: "success",
        timestamp: now,
      },
    ],
    backups: [],
    system_settings: {
      general: {
        siteName: "BytecGlobal",
        supportEmail: "bytecglobal@gmail.com",
        timezone: "Asia/Kolkata",
        dateFormat: "YYYY-MM-DD",
        maintenanceMode: false,
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        sessionExpiryHours: 24,
        enforceStrongPasswords: true,
      },
      integrations: {
        resend: {
          configured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_api_key_here"),
          status: process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_api_key_here" ? "Connected" : "Not Configured",
        },
        whatsapp: {
          configured: Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
          status: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? "Connected" : "Not Configured",
        },
        calendly: {
          configured: true,
          status: "Connected (Default Meeting Link)",
        },
      },
    },
  };
}

/**
 * Reads database from memory cache or disk
 */
export function getDb() {
  ensureDataDirectories();

  if (dbCache) {
    return dbCache;
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData = createInitialDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    dbCache = initialData;
    return dbCache;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    dbCache = JSON.parse(raw);
    return dbCache;
  } catch (err) {
    console.error("Database read error:", err);
    // Fallback to fresh initial if damaged
    const fallback = createInitialDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), "utf8");
    dbCache = fallback;
    return dbCache;
  }
}

/**
 * Atomically writes database to disk using temporary file replacement
 */
export async function saveDb(updatedDb) {
  ensureDataDirectories();
  updatedDb.meta = {
    ...updatedDb.meta,
    updatedAt: new Date().toISOString(),
  };

  dbCache = updatedDb;

  return new Promise((resolve, reject) => {
    writeQueue.push({ db: updatedDb, resolve, reject });
    processWriteQueue();
  });
}

function processWriteQueue() {
  if (isWriting || writeQueue.length === 0) return;

  isWriting = true;
  const item = writeQueue.shift();

  try {
    const tempPath = `${DB_PATH}.tmp.${crypto.randomBytes(6).toString("hex")}`;
    fs.writeFileSync(tempPath, JSON.stringify(item.db, null, 2), "utf8");
    fs.renameSync(tempPath, DB_PATH);
    isWriting = false;
    item.resolve(item.db);
  } catch (err) {
    console.error("Database atomic write error:", err);
    isWriting = false;
    item.reject(err);
  }

  if (writeQueue.length > 0) {
    process.nextTick(processWriteQueue);
  }
}
