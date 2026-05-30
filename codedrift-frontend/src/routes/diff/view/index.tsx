/*
* Author: Jamius Siam
* Since: 30/05/2026
*/
import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";

const View = (): JSX.Element => {
 return (
  <div>
    This is a view
  </div>
 );
};

export const Route = createFileRoute("/diff/view/")({
  component: View,
});