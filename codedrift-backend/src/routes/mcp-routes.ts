/*
 * Author: Jamius Siam
 * Since: 25/06/2026
 */
import type { FastifyPluginAsync } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createChangesetMcpServer } from "../mcp/changeset-mcp-server.ts";

export const mcpRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/changeset-mcp", async (request, reply): Promise<void> => {
    const server = createChangesetMcpServer();

    // Omitting `sessionIdGenerator` selects stateless mode; setting it to `undefined`
    // explicitly is rejected by the project's `exactOptionalPropertyTypes`.
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
    });

    reply.raw.on("close", () => {
      void transport.close();
      void server.close();
    });

    reply.hijack();

    try {
      // The SDK's transport types predate `exactOptionalPropertyTypes` (its `onclose`
      // field is `(() => void) | undefined`), so cast to the `Transport` connect() expects.
      await server.connect(transport as unknown as Transport);
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (error) {
      fastify.log.error(error);

      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { "Content-Type": "application/json" });
        reply.raw.end(JSON.stringify({ error: "MCP request failed" }));
      }
    }
  });
};
