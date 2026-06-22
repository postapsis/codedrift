/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Select = (): JSX.Element => {
  return (
    <div className="flex justify-center items-center w-full h-full">
      Please select the source and destination branch to view the diff
    </div>
  );
};

export const Route = createFileRoute("/repositories/")({
  component: Select,
});
