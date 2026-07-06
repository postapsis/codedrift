/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { JSX } from "react";
import Header from "@/components/header.tsx";
import { Toaster } from "@/components/ui/sonner";

const RootLayout = (): JSX.Element => (
  <div>
    <div className="flex flex-col h-screen max-h-screen px-2 pt-2.5 pb-3 gap-2">
      <Header />
      <main className="flex-1 min-h-0 min-w-0 flex gap-1 2k:gap-2">
        <Outlet />
      </main>
    </div>
    <Toaster />
    <TanStackRouterDevtools position={"bottom-left"} />
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
