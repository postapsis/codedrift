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
    <div className="flex flex-col h-screen max-h-screen px-3 py-4 gap-4">
      <Header/>
      <main className={"rounded flex-1 flex min-h-0 min-w-0 gap-3"}>
        <Outlet/>
      </main>
    </div>
    <Toaster/>
    <TanStackRouterDevtools position={"bottom-left"}/>
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
