import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

const DiffSelect = (): JSX.Element => {
  return (
    <div className="w-full h-full px-4 py-3 bg-white rounded shadow-md">
      <Outlet />
    </div>
  );
};

export const Route = createFileRoute("/repositories")({
  component: DiffSelect,
});
