"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users2,
  Inbox,
  KanbanSquare,
  Building2,
  FolderKanban,
  CalendarCheck,
  Star,
  Mail,
  Zap,
  FileCode,
  Bell,
  MessageSquare,
  Newspaper,
  LayoutTemplate,
  Info,
  Layers,
  Sparkles,
  Briefcase,
  Cpu,
  Navigation,
  Footprints,
  Search,
  Image as ImageIcon,
  UserCog,
  ShieldCheck,
  HardDrive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Traffic Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Visitors", href: "/admin/visitors", icon: Users2 },
    ],
  },
  {
    title: "BUSINESS MANAGEMENT",
    items: [
      { label: "Contact & Inquiries", href: "/admin/contacts", icon: Inbox },
      { label: "Leads", href: "/admin/leads", icon: KanbanSquare },
      { label: "CRM & Clients", href: "/admin/clients", icon: Building2 },
      { label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { label: "Meetings", href: "/admin/meetings", icon: CalendarCheck },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { label: "Email Management", href: "/admin/emails", icon: Mail },
      { label: "Automation Management", href: "/admin/automations", icon: Zap },
      { label: "Template Management", href: "/admin/templates", icon: FileCode },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "WhatsApp Management", href: "/admin/whatsapp", icon: MessageSquare },
      { label: "Newsletter", href: "/admin/newsletter", icon: Newspaper },
    ],
  },
  {
    title: "WEBSITE MANAGEMENT",
    items: [
      { label: "Homepage CMS", href: "/admin/cms/homepage", icon: LayoutTemplate },
      { label: "About Management", href: "/admin/cms/about", icon: Info },
      { label: "Services", href: "/admin/cms/services", icon: Layers },
      { label: "Solutions", href: "/admin/cms/solutions", icon: Sparkles },
      { label: "Projects / Portfolio", href: "/admin/cms/portfolio", icon: Briefcase },
      { label: "Technologies", href: "/admin/cms/technologies", icon: Cpu },
      { label: "Navigation", href: "/admin/cms/navigation", icon: Navigation },
      { label: "Footer", href: "/admin/cms/footer", icon: Footprints },
      { label: "SEO", href: "/admin/seo", icon: Search },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    title: "SYSTEM MANAGEMENT",
    items: [
      { label: "User Management", href: "/admin/users", icon: UserCog },
      { label: "Team Management", href: "/admin/team", icon: Users2 },
      { label: "Security & Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
      { label: "Backup Management", href: "/admin/backups", icon: HardDrive },
      { label: "System Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth session
  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated) {
          setAdminUser(data.user);
          setUnreadCount(data.unreadNotifications || 0);
          setLoading(false);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  // Fetch notifications
  useEffect(() => {
    if (!adminUser) return;
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, [adminUser, pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  // Generate breadcrumb from path
  const pathParts = pathname.replace("/admin", "").split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "Admin", href: "/admin/dashboard" },
    ...pathParts.map((p, idx) => ({
      label: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
      href: `/admin/${pathParts.slice(0, idx + 1).join("/")}`,
    })),
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#29251b] border-t-[#f5c518]" />
          <p className="text-sm font-medium text-gray-600">Loading BytecGlobal Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fb] text-[#1f1c1d] font-sans antialiased">
      {/* -------------------- SIDEBAR (DESKTOP) -------------------- */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-[#1c1a16] border-r border-[#2d2922] transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#2d2922]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5c518] text-[#1c1a16] font-extrabold text-lg shadow-sm">
              B
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white text-base">BytecGlobal</span>
                <span className="text-[10px] font-mono tracking-widest text-[#f5c518] uppercase -mt-0.5">Enterprise Admin</span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1 text-gray-400 hover:bg-[#2d2922] hover:text-white transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-mono font-semibold tracking-wider text-gray-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#f5c518] text-[#1c1a16] font-semibold shadow-sm"
                        : "text-gray-300 hover:bg-[#2d2922] hover:text-white"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon size={18} className={`shrink-0 ${isActive ? "text-[#1c1a16]" : "text-gray-400"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer in Sidebar */}
        <div className="p-3 border-t border-[#2d2922]">
          <div
            className={`flex items-center gap-3 rounded-xl p-2 bg-[#25221c] text-white ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5c518] text-[#1c1a16] font-bold text-xs uppercase">
              {adminUser?.name ? adminUser.name.charAt(0) : "A"}
            </div>
            {!collapsed && (
              <div className="flex-1 truncate">
                <div className="truncate text-xs font-semibold">{adminUser?.name}</div>
                <div className="text-[10px] font-mono text-gray-400 uppercase">{adminUser?.role}</div>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* -------------------- MOBILE DRAWER -------------------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex w-72 flex-col bg-[#1c1a16] border-r border-[#2d2922] p-4 text-white">
            <div className="flex items-center justify-between border-b border-[#2d2922] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5c518] text-[#1c1a16] font-bold text-base">
                  B
                </div>
                <span className="font-extrabold text-white text-base">BytecGlobal</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-mono font-semibold tracking-wider text-gray-400 uppercase">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-[#f5c518] text-[#1c1a16] font-semibold"
                            : "text-gray-300 hover:bg-[#2d2922] hover:text-white"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="border-t border-[#2d2922] pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MAIN CONTENT WRAPPER -------------------- */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "md:pl-20" : "md:pl-64"}`}>
        {/* TOP NAVIGATION BAR */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
              {breadcrumbs.map((b, i) => (
                <div key={b.href} className="flex items-center gap-2">
                  {i > 0 && <span className="text-gray-300">/</span>}
                  <Link
                    href={b.href}
                    className={`hover:text-gray-900 transition ${
                      i === breadcrumbs.length - 1 ? "font-bold text-gray-900" : ""
                    }`}
                  >
                    {b.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* View Live Public Website */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
              title="Open public website in new tab"
            >
              <span>Live Website</span>
              <ExternalLink size={13} />
            </a>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowProfileDropdown(false);
                }}
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f5c518] text-[10px] font-extrabold text-[#1c1a16] shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-2xl border border-gray-100 z-50">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <span className="font-bold text-sm text-gray-900">Notifications ({unreadCount})</span>
                    <Link
                      href="/admin/notifications"
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="text-xs text-[#9a7300] hover:underline font-medium"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-gray-400">No new notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || "/admin/notifications"}
                          onClick={() => setShowNotificationsDropdown(false)}
                          className={`block p-2 text-xs rounded-lg hover:bg-gray-50 transition ${
                            !n.read ? "bg-amber-50/50 font-medium" : "text-gray-600"
                          }`}
                        >
                          <div className="font-bold text-gray-900">{n.title}</div>
                          <div className="text-gray-500 line-clamp-2 mt-0.5">{n.message}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotificationsDropdown(false);
                }}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-3 hover:bg-gray-50 transition shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5c518] font-bold text-xs text-[#1c1a16]">
                  {adminUser?.name ? adminUser.name.charAt(0) : "A"}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-gray-800">{adminUser?.name}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{adminUser?.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{adminUser?.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {adminUser?.role}
                    </span>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Settings size={15} />
                    <span>System Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
