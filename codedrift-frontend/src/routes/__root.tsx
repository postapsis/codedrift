/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { JSX } from "react";

const RootLayout = (): JSX.Element => (
  <>
    <Outlet />
    <TanStackRouterDevtools position={"bottom-right"}/>
  </>
);

export const Route = createRootRoute({ component: RootLayout });
