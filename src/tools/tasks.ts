import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";

export function registerTaskTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "list_tasks",
    "List tasks from OmniFocus with optional filters for status, flags, tags, projects, date ranges, and text search",
    {
      completed: z.boolean().optional().describe("Filter by completion status"),
      flagged: z.boolean().optional().describe("Filter by flagged status"),
      available: z.boolean().optional().describe("Only show available (actionable) tasks"),
      inInbox: z.boolean().optional().describe("Only show inbox tasks"),
      projectId: z.string().optional().describe("Filter by project ID"),
      projectName: z.string().optional().describe("Filter by project name"),
      tagNames: z.array(z.string()).optional().describe("Filter by tag names (all must match)"),
      dueAfter: z.string().optional().describe("Filter tasks due after this ISO date"),
      dueBefore: z.string().optional().describe("Filter tasks due before this ISO date"),
      deferAfter: z.string().optional().describe("Filter tasks deferred after this ISO date"),
      deferBefore: z.string().optional().describe("Filter tasks deferred before this ISO date"),
      search: z.string().optional().describe("Full-text search in task name and note"),
      taskStatus: z.enum(["available", "remaining", "completed", "dropped"]).optional().describe("Filter by task status"),
      limit: z.number().min(1).max(1000).optional().describe("Maximum results (default 100)"),
      offset: z.number().min(0).optional().describe("Skip this many results"),
    },
    async (args) => {
      try {
        const tasks = await client.listTasks(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(tasks, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "get_task",
    "Get detailed information about a specific task by its ID",
    {
      id: z.string().describe("The task ID"),
    },
    async ({ id }) => {
      try {
        const task = await client.getTask(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "create_task",
    "Create a new task in OmniFocus. By default creates in inbox; specify projectId or projectName to add to a project.",
    {
      name: z.string().describe("Task name"),
      note: z.string().optional().describe("Task note/description"),
      flagged: z.boolean().optional().describe("Whether to flag the task"),
      deferDate: z.string().optional().describe("Defer date (ISO 8601)"),
      dueDate: z.string().optional().describe("Due date (ISO 8601)"),
      estimatedMinutes: z.number().optional().describe("Estimated duration in minutes"),
      projectId: z.string().optional().describe("Project ID to add task to"),
      projectName: z.string().optional().describe("Project name to add task to"),
      tags: z.array(z.string()).optional().describe("Tag names to apply (created if they don't exist)"),
    },
    async (args) => {
      try {
        const task = await client.createTask(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "update_task",
    "Update properties of an existing task",
    {
      id: z.string().describe("The task ID to update"),
      name: z.string().optional().describe("New task name"),
      note: z.string().optional().describe("New task note"),
      flagged: z.boolean().optional().describe("New flagged status"),
      deferDate: z.string().nullable().optional().describe("New defer date (ISO 8601) or null to clear"),
      dueDate: z.string().nullable().optional().describe("New due date (ISO 8601) or null to clear"),
      estimatedMinutes: z.number().nullable().optional().describe("New estimated minutes or null to clear"),
    },
    async (args) => {
      try {
        const task = await client.updateTask(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "complete_task",
    "Mark a task as completed",
    {
      id: z.string().describe("The task ID to complete"),
    },
    async ({ id }) => {
      try {
        const task = await client.completeTask(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "uncomplete_task",
    "Mark a completed task as incomplete (re-open it)",
    {
      id: z.string().describe("The task ID to uncomplete"),
    },
    async ({ id }) => {
      try {
        const task = await client.uncompleteTask(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "drop_task",
    "Mark a task as dropped (cancelled)",
    {
      id: z.string().describe("The task ID to drop"),
    },
    async ({ id }) => {
      try {
        const task = await client.dropTask(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "delete_task",
    "Permanently delete a task from OmniFocus",
    {
      id: z.string().describe("The task ID to delete"),
    },
    async ({ id }) => {
      try {
        const result = await client.deleteTask(id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "move_tasks",
    "Move one or more tasks to a different project or parent task. Omit destination to move to inbox.",
    {
      taskIds: z.array(z.string()).describe("Task IDs to move"),
      projectId: z.string().optional().describe("Destination project ID"),
      projectName: z.string().optional().describe("Destination project name"),
      parentTaskId: z.string().optional().describe("Destination parent task ID (for subtasks)"),
    },
    async (args) => {
      try {
        const tasks = await client.moveTasks(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(tasks, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "duplicate_tasks",
    "Duplicate one or more tasks, optionally into a different project",
    {
      taskIds: z.array(z.string()).describe("Task IDs to duplicate"),
      projectId: z.string().optional().describe("Destination project ID"),
      projectName: z.string().optional().describe("Destination project name"),
    },
    async (args) => {
      try {
        const tasks = await client.duplicateTasks(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(tasks, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "set_task_tags",
    "Set, add, or remove tags on a task",
    {
      taskId: z.string().describe("The task ID"),
      tagNames: z.array(z.string()).describe("Tag names to set/add/remove"),
      mode: z.enum(["replace", "add", "remove"]).describe("How to modify tags: replace all, add to existing, or remove specific tags"),
    },
    async (args) => {
      try {
        const task = await client.setTaskTags(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "add_task_notification",
    "Add a notification/reminder to a task",
    {
      taskId: z.string().describe("The task ID"),
      type: z.enum(["absolute", "dueRelative", "deferRelative"]).describe("Notification type"),
      absoluteDate: z.string().optional().describe("For 'absolute' type: ISO 8601 date for notification"),
      relativeOffset: z.number().optional().describe("For relative types: offset in seconds (negative = before)"),
    },
    async (args) => {
      try {
        const task = await client.addTaskNotification(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}
