import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";

export function registerTagTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "list_tags",
    "List all tags in OmniFocus",
    {},
    async () => {
      try {
        const tags = await client.listTags();
        return { content: [{ type: "text" as const, text: JSON.stringify(tags, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "create_tag",
    "Create a new tag in OmniFocus",
    {
      name: z.string().describe("Tag name"),
      parentTagId: z.string().optional().describe("Parent tag ID for nested tags"),
      parentTagName: z.string().optional().describe("Parent tag name for nested tags"),
      allowsNextAction: z.boolean().optional().describe("Whether tasks with this tag can be next actions (default true)"),
    },
    async (args) => {
      try {
        const tag = await client.createTag(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(tag, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "update_tag",
    "Update a tag's properties",
    {
      id: z.string().describe("The tag ID"),
      name: z.string().optional().describe("New tag name"),
      allowsNextAction: z.boolean().optional().describe("Whether tasks with this tag can be next actions"),
    },
    async (args) => {
      try {
        const tag = await client.updateTag(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(tag, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "delete_tag",
    "Permanently delete a tag from OmniFocus",
    {
      id: z.string().describe("The tag ID to delete"),
    },
    async ({ id }) => {
      try {
        const result = await client.deleteTag(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}
