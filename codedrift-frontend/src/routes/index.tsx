/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/repositories" });
  },
});
