import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";

export function registerFolderTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "list_folders",
    "List all folders in OmniFocus",
    {},
    async () => {
      try {
        const folders = await client.listFolders();
        return { content: [{ type: "text" as const, text: JSON.stringify(folders, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "get_folder",
    "Get detailed information about a folder including its child folders and projects",
    {
      id: z.string().describe("The folder ID"),
    },
    async ({ id }) => {
      try {
        const folder = await client.getFolder(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(folder, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "create_folder",
    "Create a new folder in OmniFocus",
    {
      name: z.string().describe("Folder name"),
      parentFolderId: z.string().optional().describe("Parent folder ID for nesting"),
      parentFolderName: z.string().optional().describe("Parent folder name for nesting"),
    },
    async (args) => {
      try {
        const folder = await client.createFolder(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(folder, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "update_folder",
    "Update a folder's properties",
    {
      id: z.string().describe("The folder ID"),
      name: z.string().optional().describe("New folder name"),
      status: z.enum(["active", "dropped"]).optional().describe("New folder status"),
    },
    async (args) => {
      try {
        const folder = await client.updateFolder(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(folder, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "delete_folder",
    "Permanently delete a folder from OmniFocus",
    {
      id: z.string().describe("The folder ID to delete"),
    },
    async ({ id }) => {
      try {
        const result = await client.deleteFolder(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}
