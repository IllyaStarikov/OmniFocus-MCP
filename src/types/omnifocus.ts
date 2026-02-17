// ─── Serialized JSON types returned from OmniJS scripts ─────────────

export interface TaskJSON {
  id: string;
  name: string;
  note: string;
  flagged: boolean;
  completed: boolean;
  dropped: boolean;
  deferDate: string | null;
  dueDate: string | null;
  completionDate: string | null;
  droppedDate: string | null;
  estimatedMinutes: number | null;
  containingProjectId: string | null;
  containingProjectName: string | null;
  parentTaskId: string | null;
  tags: { id: string; name: string }[];
  hasChildren: boolean;
  sequential: boolean;
  inInbox: boolean;
}

export interface ProjectJSON {
  id: string;
  name: string;
  note: string;
  status: "active" | "onHold" | "done" | "dropped";
  flagged: boolean;
  completed: boolean;
  deferDate: string | null;
  dueDate: string | null;
  completionDate: string | null;
  estimatedMinutes: number | null;
  containingFolderId: string | null;
  containingFolderName: string | null;
  tags: { id: string; name: string }[];
  sequential: boolean;
  taskCount: number;
  remainingTaskCount: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  reviewInterval: { steps: number; unit: string } | null;
}

export interface FolderJSON {
  id: string;
  name: string;
  parentFolderId: string | null;
  projectCount: number;
  folderCount: number;
}

export interface TagJSON {
  id: string;
  name: string;
  parentTagId: string | null;
  allowsNextAction: boolean;
  availableTaskCount: number;
  remainingTaskCount: number;
}

export interface PerspectiveJSON {
  id: string;
  name: string;
}

export interface DatabaseSummaryJSON {
  inboxCount: number;
  projectCount: number;
  tagCount: number;
  folderCount: number;
  availableTaskCount: number;
  dueSOonTaskCount: number;
  overdueTaskCount: number;
  flaggedTaskCount: number;
}

// ─── Argument types for script builders ─────────────────────────────

export interface ListTasksArgs {
  completed?: boolean;
  flagged?: boolean;
  available?: boolean;
  inInbox?: boolean;
  projectId?: string;
  projectName?: string;
  tagNames?: string[];
  dueAfter?: string;
  dueBefore?: string;
  deferAfter?: string;
  deferBefore?: string;
  search?: string;
  taskStatus?: "available" | "remaining" | "completed" | "dropped";
  limit?: number;
  offset?: number;
}

export interface CreateTaskArgs {
  name: string;
  note?: string;
  flagged?: boolean;
  deferDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  projectId?: string;
  projectName?: string;
  tags?: string[];
}

export interface UpdateTaskArgs {
  id: string;
  name?: string;
  note?: string;
  flagged?: boolean;
  deferDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
}

export interface MoveTasksArgs {
  taskIds: string[];
  projectId?: string;
  projectName?: string;
  parentTaskId?: string;
}

export interface DuplicateTasksArgs {
  taskIds: string[];
  projectId?: string;
  projectName?: string;
}

export interface SetTaskTagsArgs {
  taskId: string;
  tagNames: string[];
  mode: "replace" | "add" | "remove";
}

export interface AddTaskNotificationArgs {
  taskId: string;
  type: "absolute" | "dueRelative" | "deferRelative";
  absoluteDate?: string;
  relativeOffset?: number;
}

export interface ListProjectsArgs {
  status?: "active" | "onHold" | "done" | "dropped";
  folderId?: string;
  folderName?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateProjectArgs {
  name: string;
  note?: string;
  folderId?: string;
  folderName?: string;
  sequential?: boolean;
  singleActionList?: boolean;
  deferDate?: string;
  dueDate?: string;
  flagged?: boolean;
  tags?: string[];
  reviewInterval?: { steps: number; unit: string };
}

export interface UpdateProjectArgs {
  id: string;
  name?: string;
  note?: string;
  status?: "active" | "onHold" | "done" | "dropped";
  sequential?: boolean;
  deferDate?: string | null;
  dueDate?: string | null;
  flagged?: boolean;
  reviewInterval?: { steps: number; unit: string };
}

export interface CreateFolderArgs {
  name: string;
  parentFolderId?: string;
  parentFolderName?: string;
}

export interface UpdateFolderArgs {
  id: string;
  name?: string;
}

export interface CreateTagArgs {
  name: string;
  parentTagId?: string;
  parentTagName?: string;
  allowsNextAction?: boolean;
}

export interface UpdateTagArgs {
  id: string;
  name?: string;
  allowsNextAction?: boolean;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}
