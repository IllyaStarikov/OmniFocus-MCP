#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const { server, client } = createServer();
  const transport = new StdioServerTransport();

  const shutdown = async () => {
    logger.info("Shutting down OmniFocus MCP server");
    client.destroy();
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  logger.info("Starting OmniFocus MCP server");
  await server.connect(transport);
  logger.info("OmniFocus MCP server connected");
}

main().catch((error) => {
  logger.error("Fatal error", { error: String(error) });
  process.exit(1);
});
