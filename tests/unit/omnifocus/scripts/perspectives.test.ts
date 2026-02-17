import { describe, it, expect } from "vitest";
import {
  buildListPerspectivesScript,
  buildGetPerspectiveTasksScript,
} from "../../../../src/omnifocus/scripts/perspectives.js";

describe("perspective script builders", () => {
  describe("buildListPerspectivesScript", () => {
    it("should generate valid list script", () => {
      const script = buildListPerspectivesScript();
      expect(script).toContain("perspectives");
      expect(script).toContain("serializePerspective");
      expect(script).toContain("JSON.stringify");
    });

    it("should include built-in filter when includeBuiltIn is false", () => {
      const script = buildListPerspectivesScript({ includeBuiltIn: false });
      expect(script).toContain("builtInNames");
      expect(script).toContain("Inbox");
      expect(script).toContain("Forecast");
    });

    it("should include custom filter when includeCustom is false", () => {
      const script = buildListPerspectivesScript({ includeCustom: false });
      expect(script).toContain("builtInNames");
    });

    it("should pass no filters by default", () => {
      const script = buildListPerspectivesScript({});
      expect(script).toContain("builtInNames");
    });
  });

  describe("buildGetPerspectiveTasksScript", () => {
    it("should embed perspective name", () => {
      const script = buildGetPerspectiveTasksScript("Due Soon");
      expect(script).toContain("Due Soon");
    });

    it("should set window perspective", () => {
      const script = buildGetPerspectiveTasksScript("Forecast");
      expect(script).toContain("win.perspective");
    });

    it("should collect tasks from perspective trees", () => {
      const script = buildGetPerspectiveTasksScript("Flagged");
      expect(script).toContain("collectTasks");
      expect(script).toContain("serializeTask");
    });

    it("should handle special characters in name", () => {
      const script = buildGetPerspectiveTasksScript('My "Custom" Perspective');
      expect(script).toContain("JSON.parse");
    });
  });
});
