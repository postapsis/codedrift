/*
 * Author: Jamius Siam
 * Since: 09/07/2026
 *
 * Dev helper: runs the backend and frontend together with color-labelled,
 * prefixed output via concurrently (pulled zero-install through pnpm dlx).
 * If either process exits, the other is killed. Run with `node run.mjs`.
 */
import { spawn } from "node:child_process";

const child = spawn(
  "pnpm",
  [
    "dlx",
    "concurrently",
    "-k",
    "-n",
    "backend,frontend",
    "-c",
    "blue,magenta",
    "pnpm --dir codedrift-backend dev",
    "pnpm --dir codedrift-frontend dev",
  ],
  { stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
