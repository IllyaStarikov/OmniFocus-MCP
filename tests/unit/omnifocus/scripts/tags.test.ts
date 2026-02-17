import { describe, it, expect } from "vitest";
import {
  buildListTagsScript,
  buildGetTagScript,
  buildCreateTagScript,
  buildUpdateTagScript,
  buildDeleteTagScript,
} from "../../../../src/omnifocus/scripts/tags.js";

describe("tag script builders", () => {
  describe("buildListTagsScript", () => {
    it("should generate valid list script", () => {
      const script = buildListTagsScript();
      expect(script).toContain("flattenedTags");
      expect(script).toContain("serializeTag");
      expect(script).toContain("JSON.stringify");
    });
  });

  describe("buildGetTagScript", () => {
    it("should look up tag by ID", () => {
      const script = buildGetTagScript("tag-123");
      expect(script).toContain("tag-123");
      expect(script).toContain("byId");
    });

    it("should include tag with children serializer", () => {
      const script = buildGetTagScript("tag-123");
      expect(script).toContain("serializeTagWithChildren");
    });
  });

  describe("buildCreateTagScript", () => {
    it("should create tag with name", () => {
      const script = buildCreateTagScript({ name: "New Tag" });
      expect(script).toContain("New Tag");
      expect(script).toContain("new Tag");
      expect(script).toContain("serializeTag");
    });

    it("should handle parent tag by ID", () => {
      const script = buildCreateTagScript({ name: "Sub", parentTagId: "tag-1" });
      expect(script).toContain("tag-1");
      expect(script).toContain("flattenedTags.byId");
    });

    it("should handle parent tag by name", () => {
      const script = buildCreateTagScript({ name: "Sub", parentTagName: "Parent" });
      expect(script).toContain("Parent");
    });

    it("should handle allowsNextAction", () => {
      const script = buildCreateTagScript({ name: "Waiting", allowsNextAction: false });
      expect(script).toContain("allowsNextAction");
    });

    it("should handle status", () => {
      const script = buildCreateTagScript({ name: "OnHold", status: "onHold" });
      expect(script).toContain("Tag.Status.OnHold");
    });
  });

  describe("buildUpdateTagScript", () => {
    it("should update tag by ID", () => {
      const script = buildUpdateTagScript({ id: "tag-123", name: "Renamed" });
      expect(script).toContain("tag-123");
      expect(script).toContain("Renamed");
    });

    it("should handle status update", () => {
      const script = buildUpdateTagScript({ id: "tag-123", status: "dropped" });
      expect(script).toContain("Tag.Status.Dropped");
    });

    it("should handle allowsNextAction update", () => {
      const script = buildUpdateTagScript({ id: "tag-123", allowsNextAction: false });
      expect(script).toContain("allowsNextAction");
    });
  });

  describe("buildDeleteTagScript", () => {
    it("should delete tag by ID", () => {
      const script = buildDeleteTagScript("tag-123");
      expect(script).toContain("tag-123");
      expect(script).toContain("deleteObject");
    });
  });
});
