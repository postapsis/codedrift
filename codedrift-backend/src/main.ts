/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import Fastify from "fastify";
import { DiffService } from "./services/diff-service.ts";
import type { DiffFileData } from "./@types/diff.ts";

const fastify = Fastify({
  logger: true,
});

fastify.addHook("onRequest", async (request, reply): Promise<void> => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    await reply.status(204).send();
  }
});

fastify.get("/", async function handler() {
  return { hello: "world" };
});

fastify.get("/diff", async (): Promise<DiffFileData[]> => {
  const diffContent = await DiffService.getDiffContent();

  return DiffService.parseDiffFiles(diffContent);
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
