/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import "./db/database.ts";
import { parseArgs } from "node:util";
import Fastify from "fastify";
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

try {
  await fastify.listen({ port });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
