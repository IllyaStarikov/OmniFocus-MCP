import type { FolderJSON, FolderWithChildrenJSON } from "../../src/types/omnifocus.js";
import { mockProject, mockSequentialProject } from "./projects.js";

export const mockFolder: FolderJSON = {
  id: "folder-1",
  name: "Personal",
  url: "omnifocus:///folder/folder-1",
  status: "active",
  parentFolderId: null,
  childFolderIds: ["folder-2"],
  projectIds: ["proj-1", "proj-2", "proj-3"],
  projectCount: 3,
  folderCount: 1,
};

export const mockNestedFolder: FolderJSON = {
  id: "folder-2",
  name: "Health",
  url: "omnifocus:///folder/folder-2",
  status: "active",
  parentFolderId: "folder-1",
  childFolderIds: [],
  projectIds: ["proj-4", "proj-5"],
  projectCount: 2,
  folderCount: 0,
};

export const mockFolderWithChildren: FolderWithChildrenJSON = {
  ...mockFolder,
  childFolders: [{
    ...mockNestedFolder,
    childFolders: [],
    projects: [],
  }],
  projects: [mockProject, mockSequentialProject],
};
