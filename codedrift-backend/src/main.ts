/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import "./db/database.ts";
import Fastify from "fastify";
import { DiffService } from "./services/diff-service.ts";
import { repositoryRoutes } from "./routes/repository-routes.ts";
import { changesetRoutes } from "./routes/changeset-routes.ts";
import type { DiffFileData } from "./@types/diff.ts";

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

fastify.get("/diff", async (): Promise<DiffFileData[]> => {
  return DiffService.getDiffFiles();
});

await fastify.register(repositoryRoutes);
await fastify.register(changesetRoutes);

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
