"use client";

import { usePathname } from "next/navigation";
import AdminLayout from "@/components/admin/admin-layout";

export default function RootAdminLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#181613] text-[#1f1c1d] flex flex-col">{children}</div>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
