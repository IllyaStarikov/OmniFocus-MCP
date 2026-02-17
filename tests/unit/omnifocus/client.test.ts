import { describe, it, expect, vi, beforeEach } from "vitest";
import { OmniFocusClient } from "../../../src/omnifocus/client.js";
import { mockDatabaseSummary, mockSearchResults, mockDatabaseDump } from "../../fixtures/database.js";
import { mockTask, mockFlaggedTask, mockCompletedTask, mockTaskList } from "../../fixtures/tasks.js";
import { mockProject } from "../../fixtures/projects.js";
import { mockFolder, mockFolderWithChildren } from "../../fixtures/folders.js";
import { mockTag, mockTagWithChildren } from "../../fixtures/tags.js";
import { mockAbsoluteNotification, mockDueRelativeNotification } from "../../fixtures/notifications.js";

// Mock the executor module
vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

describe("OmniFocusClient", () => {
  let client: OmniFocusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OmniFocusClient();
  });

  // ─── Database ─────────────────────────────────────────────────────

  describe("getDatabaseSummary", () => {
    it("should return database summary from executor", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      const result = await client.getDatabaseSummary();
      expect(result).toEqual(mockDatabaseSummary);
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
    });

    it("should cache database summary", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
    });

    it("should refresh after cache invalidation", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      client.invalidateCache("database:");
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(2);
    });
  });

  describe("search", () => {
    it("should return search results", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockSearchResults);
      const results = await client.search("grocery");
      expect(results).toHaveLength(3);
    });

    it("should pass limit to executor", async () => {
      mockRunOmniJSJson.mockResolvedValue([]);
      await client.search("test", 10);
      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("10");
    });
  });

  describe("dumpDatabase", () => {
    it("should return full database dump", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseDump);
      const result = await client.dumpDatabase();
      expect(result).toEqual(mockDatabaseDump);
    });

    it("should pass options to script", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseDump);
      await client.dumpDatabase({ includeCompleted: true, maxDepth: 3 });
      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("includeCompleted");
      expect(scriptArg).toContain("3");
    });
  });

  describe("saveDatabase", () => {
    it("should return saved status", async () => {
      mockRunOmniJSJson.mockResolvedValue({ saved: true });
      const result = await client.saveDatabase();
      expect(result.saved).toBe(true);
    });
  });

  // ─── Tasks ────────────────────────────────────────────────────────

  describe("uncompleteTask", () => {
    it("should uncomplete and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue({ ...mockCompletedTask, completed: false });
      const result = await client.uncompleteTask("task-completed-1");
      expect(result.completed).toBe(false);
    });
  });

  describe("dropTask", () => {
    it("should drop and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue({ ...mockTask, dropped: true });
      const result = await client.dropTask("task-abc-123");
      expect(result.dropped).toBe(true);
    });
  });

  describe("duplicateTasks", () => {
    it("should duplicate and return tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockTask]);
      const result = await client.duplicateTasks({ taskIds: ["task-abc-123"] });
      expect(result).toHaveLength(1);
    });
  });

  describe("addTaskNotification", () => {
    it("should add notification and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      const result = await client.addTaskNotification({
        taskId: "task-abc-123",
        type: "absolute",
        absoluteDate: "2024-12-20T09:00:00Z",
      });
      expect(result.id).toBe("task-abc-123");
    });
  });

  describe("appendTaskNote", () => {
    it("should append note and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      const result = await client.appendTaskNote("task-abc-123", "Extra text");
      expect(result.id).toBe("task-abc-123");
    });
  });

  describe("convertTaskToProject", () => {
    it("should convert task to project and return it", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockProject);
      const result = await client.convertTaskToProject("task-abc-123");
      expect(result.id).toBe("proj-abc-123");
    });
  });

  describe("getTodayCompletedTasks", () => {
    it("should return today's completed tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockCompletedTask]);
      const result = await client.getTodayCompletedTasks();
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(true);
    });
  });

  describe("listTaskNotifications", () => {
    it("should return notifications for a task", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockAbsoluteNotification, mockDueRelativeNotification]);
      const result = await client.listTaskNotifications("task-abc-123");
      expect(result).toHaveLength(2);
      expect(result[0].kind).toBe("absolute");
      expect(result[1].kind).toBe("dueRelative");
    });
  });

  describe("removeTaskNotification", () => {
    it("should remove notification and return confirmation", async () => {
      mockRunOmniJSJson.mockResolvedValue({
        removed: true,
        taskId: "task-abc-123",
        notificationId: "notif-1",
      });
      const result = await client.removeTaskNotification("task-abc-123", "notif-1");
      expect(result.removed).toBe(true);
    });
  });

  describe("batchCreateTasks", () => {
    it("should batch create and return tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockTask, mockFlaggedTask]);
      const result = await client.batchCreateTasks({
        tasks: [{ name: "Task 1" }, { name: "Task 2" }],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("batchDeleteTasks", () => {
    it("should batch delete and return confirmations", async () => {
      mockRunOmniJSJson.mockResolvedValue([
        { deleted: true, id: "task-1" },
        { deleted: true, id: "task-2" },
      ]);
      const result = await client.batchDeleteTasks({ taskIds: ["task-1", "task-2"] });
      expect(result).toHaveLength(2);
      expect(result[0].deleted).toBe(true);
    });
  });

  describe("batchCompleteTasks", () => {
    it("should batch complete and return tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockCompletedTask]);
      const result = await client.batchCompleteTasks({ taskIds: ["task-1"] });
      expect(result).toHaveLength(1);
      expect(result[0].completed).toBe(true);
    });
  });

  describe("getTaskCount", () => {
    it("should return task count", async () => {
      mockRunOmniJSJson.mockResolvedValue({ count: 42 });
      const result = await client.getTaskCount({ flagged: true });
      expect(result.count).toBe(42);
    });

    it("should pass filter args to script", async () => {
      mockRunOmniJSJson.mockResolvedValue({ count: 5 });
      await client.getTaskCount({ taskStatus: "available", projectName: "Work" });
      const scriptArg = mockRunOmniJSJson.mock.calls[0][0];
      expect(scriptArg).toContain("available");
      expect(scriptArg).toContain("Work");
    });
  });

  // ─── Projects ─────────────────────────────────────────────────────

  describe("dropProject", () => {
    it("should drop and return project", async () => {
      mockRunOmniJSJson.mockResolvedValue({ ...mockProject, status: "dropped" });
      const result = await client.dropProject("proj-abc-123");
      expect(result.status).toBe("dropped");
    });
  });

  describe("moveProject", () => {
    it("should move and return project", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockProject);
      const result = await client.moveProject("proj-abc-123", "folder-2");
      expect(result.id).toBe("proj-abc-123");
    });
  });

  describe("getProjectTasks", () => {
    it("should return project tasks", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTaskList);
      const result = await client.getProjectTasks({ projectId: "proj-abc-123" });
      expect(result).toHaveLength(3);
    });
  });

  // ─── Folders ──────────────────────────────────────────────────────

  describe("getFolder", () => {
    it("should return folder with children", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockFolderWithChildren);
      const result = await client.getFolder("folder-1");
      expect(result.id).toBe("folder-1");
      expect(result.childFolders).toHaveLength(1);
    });
  });

  // ─── Tags ─────────────────────────────────────────────────────────

  describe("getTag", () => {
    it("should return tag with children", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTagWithChildren);
      const result = await client.getTag("tag-1");
      expect(result.id).toBe("tag-1");
      expect(result.childTags).toHaveLength(1);
    });
  });

  // ─── Cache invalidation (Bug 4 regression) ────────────────────────

  describe("database cache invalidation after mutations", () => {
    it("should invalidate database cache after createTask", async () => {
      // Prime the database summary cache
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);

      // Create a task — should invalidate database: cache
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      await client.createTask({ name: "New task" });

      // getDatabaseSummary should call executor again (not cached)
      mockRunOmniJSJson.mockResolvedValue({ ...mockDatabaseSummary, availableTaskCount: 43 });
      const result = await client.getDatabaseSummary();
      expect(result.availableTaskCount).toBe(43);
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after deleteTask", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue({ deleted: true, id: "task-1" });
      await client.deleteTask("task-1");

      mockRunOmniJSJson.mockResolvedValue({ ...mockDatabaseSummary, availableTaskCount: 41 });
      const result = await client.getDatabaseSummary();
      expect(result.availableTaskCount).toBe(41);
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after completeTask", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue(mockCompletedTask);
      await client.completeTask("task-1");

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after deleteProject", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue({ deleted: true, id: "proj-1" });
      await client.deleteProject("proj-1");

      mockRunOmniJSJson.mockResolvedValue({ ...mockDatabaseSummary, projectCount: 11 });
      const result = await client.getDatabaseSummary();
      expect(result.projectCount).toBe(11);
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after createProject", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue(mockProject);
      await client.createProject({ name: "New project" });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after batchCreateTasks", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue([mockTask]);
      await client.batchCreateTasks({ tasks: [{ name: "Task" }] });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after batchDeleteTasks", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue([{ deleted: true, id: "task-1" }]);
      await client.batchDeleteTasks({ taskIds: ["task-1"] });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after batchCompleteTasks", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue([mockCompletedTask]);
      await client.batchCompleteTasks({ taskIds: ["task-1"] });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after setTaskTags", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue(mockTask);
      await client.setTaskTags({ taskId: "task-1", tagNames: ["new"], mode: "add" });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after createFolder", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue(mockFolder);
      await client.createFolder({ name: "New folder" });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });

    it("should invalidate database cache after createTag", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();

      mockRunOmniJSJson.mockResolvedValue(mockTag);
      await client.createTag({ name: "New tag" });

      mockRunOmniJSJson.mockResolvedValue(mockDatabaseSummary);
      await client.getDatabaseSummary();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });
  });
});
