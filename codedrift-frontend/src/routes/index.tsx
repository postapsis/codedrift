/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { JSX } from "react";

const Index = (): JSX.Element => {
  return (
    <div className="w-full h-full px-4 py-3 flex flex-col justify-center items-center gap-2 bg-white rounded shadow-md">
      <h3>Welcome to Codedrift</h3>

      <Link to="/diff/select">
        <Button>Stacked Diff</Button>
      </Link>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
