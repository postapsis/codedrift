import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

const Index = (): JSX.Element => {
  return (
    <div>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab culpa cupiditate facilis,
      incidunt inventore ipsam minima natus ratione rem voluptates!
    </div>
  );
};

export const Route = createFileRoute("/diff/")({
  component: Index,
});
