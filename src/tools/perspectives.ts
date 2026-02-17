import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";

export function registerPerspectiveTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "list_perspectives",
    "List perspectives in OmniFocus. By default lists custom perspectives; use filters to include/exclude built-in ones.",
    {
      includeBuiltIn: z.boolean().optional().describe("Include built-in perspectives (default true)"),
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
    "Get tasks shown in a specific perspective",
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
