/*
 * Author: Jamius Siam
 * Since: 24/06/2026
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/repositories" });
  },
});
