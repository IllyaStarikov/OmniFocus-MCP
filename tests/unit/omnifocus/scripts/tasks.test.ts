import { describe, it, expect } from "vitest";
import { buildListTasksScript, buildGetTaskScript, buildCreateTaskScript } from "../../../../src/omnifocus/scripts/tasks.js";

describe("task script builders", () => {
  describe("buildListTasksScript", () => {
    it("should generate valid script with no filters", () => {
      const script = buildListTasksScript({});
      expect(script).toContain("document.flattenedTasks");
      expect(script).toContain("serializeTask");
      expect(script).toContain("JSON.stringify");
    });

    it("should include inbox filter when inInbox is true", () => {
      const script = buildListTasksScript({ inInbox: true });
      expect(script).toContain("inboxTasks");
    });

    it("should include flagged filter", () => {
      const script = buildListTasksScript({ flagged: true });
      expect(script).toContain("flagged");
    });

    it("should include tag filter", () => {
      const script = buildListTasksScript({ tagNames: ["work", "urgent"] });
      expect(script).toContain("tagNames");
    });

    it("should include date range filters", () => {
      const script = buildListTasksScript({
        dueAfter: "2024-01-01T00:00:00Z",
        dueBefore: "2024-12-31T23:59:59Z",
      });
      expect(script).toContain("dueAfter");
      expect(script).toContain("dueBefore");
    });

    it("should include search filter", () => {
      const script = buildListTasksScript({ search: "groceries" });
      expect(script).toContain("groceries");
    });

    it("should include pagination", () => {
      const script = buildListTasksScript({ limit: 50, offset: 10 });
      expect(script).toContain("50");
      expect(script).toContain("10");
    });

    it("should include taskStatus filter", () => {
      const script = buildListTasksScript({ taskStatus: "available" });
      expect(script).toContain("available");
    });
  });

  describe("buildGetTaskScript", () => {
    it("should include task ID", () => {
      const script = buildGetTaskScript("task-123");
      expect(script).toContain("task-123");
      expect(script).toContain("byId");
    });
  });

  describe("buildCreateTaskScript", () => {
    it("should safely embed task name with special chars via JSON.parse", () => {
      const script = buildCreateTaskScript({
        name: 'Task with "quotes" and `backticks`',
      });
      // User data should be embedded via JSON.parse, not direct string interpolation
      expect(script).toContain("JSON.parse");
      // The args are double-JSON-stringified: the outer JSON.stringify wraps the inner JSON string
      // so the actual task name is never directly in the script template
      expect(script).toContain("args.name");
    });

    it("should include project assignment", () => {
      const script = buildCreateTaskScript({
        name: "Test",
        projectId: "proj-123",
      });
      expect(script).toContain("proj-123");
    });

    it("should include tags", () => {
      const script = buildCreateTaskScript({
        name: "Test",
        tags: ["work", "urgent"],
      });
      expect(script).toContain("work");
      expect(script).toContain("urgent");
    });

    it("should handle emoji in task name", () => {
      const script = buildCreateTaskScript({
        name: "Buy groceries 🛒",
      });
      expect(script).toContain("🛒");
    });
  });
});
