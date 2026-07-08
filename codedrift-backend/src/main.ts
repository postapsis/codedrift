#!/usr/bin/env node

/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import "./db/database.ts";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { repositoryRoutes } from "./routes/repository-routes.ts";
import { mcpRoutes } from "./routes/mcp-routes.ts";
import { reviewRoutes } from "./routes/review-routes.ts";

const fastify = Fastify({
  logger: true,
});

fastify.addHook("onRequest", async (request, reply): Promise<void> => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    await reply.status(204).send();
  }
});

await fastify.register(repositoryRoutes);
await fastify.register(mcpRoutes);
await fastify.register(reviewRoutes);

const { values } = parseArgs({
  options: {
    port: { type: "string", short: "p" },
  },
  strict: false,
});

const port = Number(values.port) || 19019;

// Serve the built React SPA at /app (present once the frontend has been built + copied).
const webDir = path.join(import.meta.dirname, "..", "public");

if (existsSync(webDir)) {
  await fastify.register(
    (childContext, _opts, done): void => {
      childContext.register(fastifyStatic, { root: webDir, wildcard: false });
      childContext.setNotFoundHandler((_request, reply) =>
        reply.type("text/html").sendFile("index.html"),
      );
      done();
    },
    { prefix: "/app" },
  );

  console.log(`Serving frontend at http://localhost:${port}/app`);
}

try {
  await fastify.listen({ port });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
