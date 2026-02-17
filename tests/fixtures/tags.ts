import type { TagJSON, TagWithChildrenJSON } from "../../src/types/omnifocus.js";

export const mockTag: TagJSON = {
  id: "tag-1",
  name: "errands",
  url: "omnifocus:///tag/tag-1",
  status: "active",
  parentTagId: null,
  childTagIds: [],
  allowsNextAction: true,
  availableTaskCount: 5,
  remainingTaskCount: 7,
};

export const mockNestedTag: TagJSON = {
  id: "tag-2",
  name: "grocery store",
  url: "omnifocus:///tag/tag-2",
  status: "active",
  parentTagId: "tag-1",
  childTagIds: [],
  allowsNextAction: true,
  availableTaskCount: 2,
  remainingTaskCount: 3,
};

export const mockOnHoldTag: TagJSON = {
  id: "tag-3",
  name: "waiting",
  url: "omnifocus:///tag/tag-3",
  status: "onHold",
  parentTagId: null,
  childTagIds: [],
  allowsNextAction: false,
  availableTaskCount: 0,
  remainingTaskCount: 4,
};

export const mockTagWithChildren: TagWithChildrenJSON = {
  ...mockTag,
  childTags: [{
    ...mockNestedTag,
    childTags: [],
  }],
};
