import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OmniFocusClient } from "./omnifocus/client.js";
import { formatMcpError } from "./utils/errors.js";

export function registerResources(server: McpServer, client: OmniFocusClient): void {
  server.resource(
    "database-summary",
    "omnifocus://database/summary",
    { description: "OmniFocus database summary with counts", mimeType: "application/json" },
    async () => {
      try {
        const summary = await client.getDatabaseSummary();
        return {
          contents: [{
            uri: "omnifocus://database/summary",
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2),
          }],
        };
      } catch (error) {
        const { message } = formatMcpError(error);
        return {
          contents: [{
            uri: "omnifocus://database/summary",
            mimeType: "application/json",
            text: JSON.stringify({ error: message }),
          }],
        };
      }
    },
  );

  server.resource(
    "perspectives",
    "omnifocus://perspectives",
    { description: "List of all OmniFocus perspectives", mimeType: "application/json" },
    async () => {
      try {
        const perspectives = await client.listPerspectives();
        return {
          contents: [{
            uri: "omnifocus://perspectives",
            mimeType: "application/json",
            text: JSON.stringify(perspectives, null, 2),
          }],
        };
      } catch (error) {
        const { message } = formatMcpError(error);
        return {
          contents: [{
            uri: "omnifocus://perspectives",
            mimeType: "application/json",
            text: JSON.stringify({ error: message }),
          }],
        };
      }
    },
  );
}
