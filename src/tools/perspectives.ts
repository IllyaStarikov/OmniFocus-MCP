import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";

export function registerPerspectiveTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "list_perspectives",
    "List perspectives in OmniFocus. Only custom perspectives are available; built-in perspectives (Inbox, Projects, Tags, Forecast, Flagged, Review, Nearby) cannot be accessed via the API. Use dedicated tools instead (e.g. get_inbox_tasks, get_flagged_tasks, get_review_queue, list_projects, list_tags, or list_tasks with date filters for Forecast).",
    {
      includeBuiltIn: z.boolean().optional().describe("Include custom perspectives whose names match built-in perspective names (default true). Note: actual built-in perspectives are not available via the API."),
      includeCustom: z.boolean().optional().describe("Include custom perspectives (default true)"),
    },
    async (args) => {
      try {
        const perspectives = await client.listPerspectives(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(perspectives, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "get_perspective_tasks",
    "Get tasks shown in a specific custom perspective. Built-in perspectives (Inbox, Forecast, etc.) are not supported — use dedicated tools instead.",
    {
      name: z.string().describe("The perspective name"),
    },
    async ({ name }) => {
      try {
        const tasks = await client.getPerspectiveTasks(name);
        return { content: [{ type: "text" as const, text: JSON.stringify(tasks, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}
