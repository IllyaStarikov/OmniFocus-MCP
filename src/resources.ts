import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OmniFocusClient } from "./omnifocus/client.js";

export function registerResources(server: McpServer, client: OmniFocusClient): void {
  server.resource(
    "database-summary",
    "omnifocus://database/summary",
    { description: "OmniFocus database summary with counts", mimeType: "application/json" },
    async () => {
      const summary = await client.getDatabaseSummary();
      return {
        contents: [{
          uri: "omnifocus://database/summary",
          mimeType: "application/json",
          text: JSON.stringify(summary, null, 2),
        }],
      };
    },
  );

  server.resource(
    "perspectives",
    "omnifocus://perspectives",
    { description: "List of all OmniFocus perspectives", mimeType: "application/json" },
    async () => {
      const perspectives = await client.listPerspectives();
      return {
        contents: [{
          uri: "omnifocus://perspectives",
          mimeType: "application/json",
          text: JSON.stringify(perspectives, null, 2),
        }],
      };
    },
  );
}
