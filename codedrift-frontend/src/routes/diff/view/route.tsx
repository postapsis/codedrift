/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import Sidebar from "@/components/sidebar/sidebar.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";

const DiffViewLayout = (): JSX.Element => {
  return (
    <>
      <Sidebar />
      <div
        className={`flex-1 overflow-auto px-4 py-3 bg-white rounded shadow-md ${THIN_SCROLLBAR_CLASS}`}>
        <Outlet />
      </div>
    </>
  );
};

export const Route = createFileRoute("/diff/view")({
  component: DiffViewLayout,
});
