/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { JSX } from "react";
import Header from "@/components/header/header";

const RootLayout = (): JSX.Element => (
  <div className="flex flex-col h-screen px-3 pt-4 gap-3.5">
    <Header />
    <main className={"rounded h-full flex-1 flex gap-3"}>
      <Outlet />
    </main>
    <TanStackRouterDevtools position={"bottom-right"} />
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
