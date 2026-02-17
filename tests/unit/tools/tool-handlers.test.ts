import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../../src/server.js";
import { mockTask, mockTaskList, mockInboxTask } from "../../fixtures/tasks.js";
import { mockDatabaseDump } from "../../fixtures/database.js";
import { NotRunningError, ScriptError, TimeoutError } from "../../../src/utils/errors.js";

// Mock the executor module so no real OmniFocus calls are made
vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

describe("Tool handler tests via MCP protocol", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const { server } = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await cleanup();
  });

  // ─── Tool handler behavior tests ──────────────────────────────────

  describe("get_inbox_tasks", () => {
    it("should pass taskStatus 'available' to filter out completed/dropped (Bug 5 regression)", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockInboxTask]);
      const result = await client.callTool({ name: "get_inbox_tasks", arguments: {} });

      // Verify the generated script embeds taskStatus available via double-JSON-stringified args
      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("taskStatus");
      expect(scriptArg).toContain("available");
      // The args are embedded as JSON.parse('{"inInbox":true,"taskStatus":"available"}')
      expect(scriptArg).toContain("inInbox");

      // Verify response is successful
      const content = result.content as Array<{ type: string; text: string }>;
      expect(result.isError).toBeFalsy();
      expect(content[0].type).toBe("text");
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toHaveLength(1);
    });
  });

  describe("get_flagged_tasks", () => {
    it("should pass flagged: true and taskStatus: 'available'", async () => {
      mockRunOmniJSJson.mockResolvedValue([]);
      await client.callTool({ name: "get_flagged_tasks", arguments: {} });

      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("flagged");
      expect(scriptArg).toContain("taskStatus");
      expect(scriptArg).toContain("available");
    });
  });

  describe("create_task", () => {
    it("should create task with all optional params", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      const result = await client.callTool({
        name: "create_task",
        arguments: {
          name: "Test task",
          note: "Some notes",
          flagged: true,
          deferDate: "2024-01-01T00:00:00Z",
          dueDate: "2024-12-31T23:59:59Z",
          estimatedMinutes: 30,
          projectId: "proj-1",
          tags: ["work", "urgent"],
        },
      });

      const content = result.content as Array<{ type: string; text: string }>;
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(content[0].text);
      expect(parsed.id).toBe("task-abc-123");
    });
  });

  describe("batch_create_tasks", () => {
    it("should create nested task hierarchy", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTaskList);
      const result = await client.callTool({
        name: "batch_create_tasks",
        arguments: {
          tasks: [
            {
              name: "Parent task",
              children: [
                { name: "Child 1" },
                { name: "Child 2" },
              ],
            },
          ],
          projectId: "proj-1",
        },
      });

      expect(result.isError).toBeFalsy();

      // Args are embedded via JSON.parse of a stringified JSON, so names appear in the script
      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("createTaskFromItem");
      expect(scriptArg).toContain("proj-1");
    });
  });

  describe("dump_database", () => {
    it("should pass includeCompleted option", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseDump);
      await client.callTool({
        name: "dump_database",
        arguments: { includeCompleted: true },
      });

      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      // The script should contain the includeCompleted logic
      expect(scriptArg).toContain("includeCompleted");
    });

    it("should pass hideRecurringDuplicates option", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseDump);
      await client.callTool({
        name: "dump_database",
        arguments: { hideRecurringDuplicates: true },
      });

      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("hideRecurringDuplicates");
    });
  });

  describe("batch_delete_tasks", () => {
    it("should delete multiple tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue([
        { deleted: true, id: "task-1" },
        { deleted: true, id: "task-2" },
      ]);
      const result = await client.callTool({
        name: "batch_delete_tasks",
        arguments: { taskIds: ["task-1", "task-2"] },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].deleted).toBe(true);
    });
  });

  describe("batch_complete_tasks", () => {
    it("should complete multiple tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockTask]);
      const result = await client.callTool({
        name: "batch_complete_tasks",
        arguments: { taskIds: ["task-1"] },
      });

      expect(result.isError).toBeFalsy();
      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("markComplete");
    });
  });

  describe("get_task_count", () => {
    it("should return count matching filters", async () => {
      mockRunOmniJSJson.mockResolvedValue({ count: 15 });
      const result = await client.callTool({
        name: "get_task_count",
        arguments: { flagged: true, taskStatus: "available" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed.count).toBe(15);
    });
  });

  // ─── Error handling tests ─────────────────────────────────────────

  describe("error handling", () => {
    it("should return isError with retryable message for NotRunningError", async () => {
      mockRunOmniJSJson.mockRejectedValue(new NotRunningError());
      const result = await client.callTool({
        name: "get_database_summary",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toContain("not running");
      expect(content[0].text).toContain("Please ensure OmniFocus is running");
    });

    it("should return isError for ScriptError", async () => {
      mockRunOmniJSJson.mockRejectedValue(new ScriptError("Task not found: task-999"));
      const result = await client.callTool({
        name: "get_task",
        arguments: { id: "task-999" },
      });

      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toContain("Task not found");
    });

    it("should return isError with retryable message for TimeoutError", async () => {
      mockRunOmniJSJson.mockRejectedValue(new TimeoutError());
      const result = await client.callTool({
        name: "list_tasks",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toContain("timed out");
    });

    it("should handle unexpected errors gracefully", async () => {
      mockRunOmniJSJson.mockRejectedValue(new Error("Something unexpected"));
      const result = await client.callTool({
        name: "search",
        arguments: { query: "test" },
      });

      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toContain("Something unexpected");
    });
  });
});
