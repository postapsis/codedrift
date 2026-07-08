/*
 * Author: Jamius Siam
 * Since: 08/07/2026
 *
 * Copies the built frontend (codedrift-frontend/dist) into codedrift-backend/public
 * so the backend can serve the SPA at /app. Run as part of the backend build.
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(backendDir, "../codedrift-frontend/dist");
const dest = path.resolve(backendDir, "public");

if (!existsSync(src)) {
  console.error(`Frontend build not found. Build the frontend first.`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied frontend build`);
