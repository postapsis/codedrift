/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import type { JSX } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardSidebar from "@/components/dashboard-sidebar.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

const DashboardLayout = (): JSX.Element => {
  return (
    <>
      <DashboardSidebar />
      <div
        className={`flex-1 overflow-auto px-4 py-3 bg-white rounded shadow-md ${THIN_SCROLLBAR_CLASS}`}>
        <Outlet />
      </div>
    </>
  );
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});
