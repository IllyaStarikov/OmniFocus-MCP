import { describe, it, expect, vi, beforeEach } from "vitest";
import { OmniFocusClient } from "../../../src/omnifocus/client.js";
import type { TagJSON } from "../../../src/types/omnifocus.js";

vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

const mockTag: TagJSON = {
  id: "tag-1",
  name: "errands",
  parentTagId: null,
  allowsNextAction: true,
  availableTaskCount: 5,
  remainingTaskCount: 7,
};

const mockNestedTag: TagJSON = {
  id: "tag-2",
  name: "grocery store",
  parentTagId: "tag-1",
  allowsNextAction: true,
  availableTaskCount: 2,
  remainingTaskCount: 3,
};

const mockOnHoldTag: TagJSON = {
  id: "tag-3",
  name: "waiting",
  parentTagId: null,
  allowsNextAction: false,
  availableTaskCount: 0,
  remainingTaskCount: 4,
};

describe("Tag client methods", () => {
  let client: OmniFocusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OmniFocusClient();
  });

  it("should list tags", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockTag, mockNestedTag, mockOnHoldTag]);
    const tags = await client.listTags();
    expect(tags).toHaveLength(3);
  });

  it("should cache tag list", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockTag]);
    await client.listTags();
    await client.listTags();
    expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
  });

  it("should create tag", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockTag);
    const result = await client.createTag({ name: "errands" });
    expect(result.name).toBe("errands");
  });

  it("should create nested tag", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockNestedTag);
    const result = await client.createTag({ name: "grocery store", parentTagId: "tag-1" });
    expect(result.parentTagId).toBe("tag-1");
  });

  it("should create tag with allowsNextAction", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockOnHoldTag);
    const result = await client.createTag({ name: "waiting", allowsNextAction: false });
    expect(result.allowsNextAction).toBe(false);
  });

  it("should update tag", async () => {
    mockRunOmniJSJson.mockResolvedValue({ ...mockTag, name: "renamed" });
    const result = await client.updateTag({ id: "tag-1", name: "renamed" });
    expect(result.name).toBe("renamed");
  });

  it("should delete tag", async () => {
    mockRunOmniJSJson.mockResolvedValue({ deleted: true, id: "tag-1" });
    const result = await client.deleteTag("tag-1");
    expect(result.deleted).toBe(true);
  });
});
