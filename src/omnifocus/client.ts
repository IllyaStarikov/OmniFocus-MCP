import { runOmniJSJson } from "./executor.js";
import { Cache } from "./cache.js";
import { config } from "../config.js";
import { buildDatabaseSummaryScript, buildSearchScript } from "./scripts/database.js";
import { buildListFoldersScript, buildCreateFolderScript, buildUpdateFolderScript, buildDeleteFolderScript } from "./scripts/folders.js";
import { buildListTagsScript, buildCreateTagScript, buildUpdateTagScript, buildDeleteTagScript } from "./scripts/tags.js";
import { buildListPerspectivesScript, buildGetPerspectiveTasksScript } from "./scripts/perspectives.js";
import {
  buildListProjectsScript,
  buildGetProjectScript,
  buildCreateProjectScript,
  buildUpdateProjectScript,
  buildCompleteProjectScript,
  buildDeleteProjectScript,
  buildGetReviewQueueScript,
  buildMarkReviewedScript,
} from "./scripts/projects.js";
import {
  buildListTasksScript,
  buildGetTaskScript,
  buildCreateTaskScript,
  buildUpdateTaskScript,
  buildCompleteTaskScript,
  buildUncompleteTaskScript,
  buildDropTaskScript,
  buildDeleteTaskScript,
  buildMoveTasksScript,
  buildDuplicateTasksScript,
  buildSetTaskTagsScript,
  buildAddTaskNotificationScript,
} from "./scripts/tasks.js";
import type {
  DatabaseSummaryJSON,
  TaskJSON,
  ProjectJSON,
  FolderJSON,
  TagJSON,
  PerspectiveJSON,
  ListTasksArgs,
  CreateTaskArgs,
  UpdateTaskArgs,
  MoveTasksArgs,
  DuplicateTasksArgs,
  SetTaskTagsArgs,
  AddTaskNotificationArgs,
  ListProjectsArgs,
  CreateProjectArgs,
  UpdateProjectArgs,
  CreateFolderArgs,
  UpdateFolderArgs,
  CreateTagArgs,
  UpdateTagArgs,
} from "../types/omnifocus.js";

export class OmniFocusClient {
  private cache = new Cache();

  // ─── Database ──────────────────────────────────────────────────────

  async getDatabaseSummary(): Promise<DatabaseSummaryJSON> {
    const cacheKey = "database:summary";
    const cached = this.cache.get<DatabaseSummaryJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<DatabaseSummaryJSON>(buildDatabaseSummaryScript());
    this.cache.set(cacheKey, result, config.cacheTTL.database);
    return result;
  }

  async search(query: string, limit = 50): Promise<Array<{ type: string; id: string; name: string; note?: string }>> {
    return runOmniJSJson(buildSearchScript(query, limit));
  }

  // ─── Tasks ─────────────────────────────────────────────────────────

  async listTasks(args: ListTasksArgs = {}): Promise<TaskJSON[]> {
    const cacheKey = `tasks:list:${JSON.stringify(args)}`;
    const cached = this.cache.get<TaskJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON[]>(buildListTasksScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  async getTask(id: string): Promise<TaskJSON> {
    const cacheKey = `tasks:get:${id}`;
    const cached = this.cache.get<TaskJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON>(buildGetTaskScript(id));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  async createTask(args: CreateTaskArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildCreateTaskScript(args));
    this.cache.invalidatePrefix("tasks:");
    return result;
  }

  async updateTask(args: UpdateTaskArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildUpdateTaskScript(args));
    this.cache.invalidatePrefix("tasks:");
    return result;
  }

  async completeTask(id: string): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildCompleteTaskScript(id));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async uncompleteTask(id: string): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildUncompleteTaskScript(id));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async dropTask(id: string): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildDropTaskScript(id));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async deleteTask(id: string): Promise<{ deleted: boolean; id: string }> {
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteTaskScript(id));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async moveTasks(args: MoveTasksArgs): Promise<TaskJSON[]> {
    const result = await runOmniJSJson<TaskJSON[]>(buildMoveTasksScript(args));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async duplicateTasks(args: DuplicateTasksArgs): Promise<TaskJSON[]> {
    const result = await runOmniJSJson<TaskJSON[]>(buildDuplicateTasksScript(args));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async setTaskTags(args: SetTaskTagsArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildSetTaskTagsScript(args));
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("tags:");
    return result;
  }

  async addTaskNotification(args: AddTaskNotificationArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildAddTaskNotificationScript(args));
    this.cache.invalidatePrefix("tasks:");
    return result;
  }

  // ─── Projects ─────────────────────────────────────────────────────

  async listProjects(args: ListProjectsArgs = {}): Promise<ProjectJSON[]> {
    const cacheKey = `projects:list:${JSON.stringify(args)}`;
    const cached = this.cache.get<ProjectJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<ProjectJSON[]>(buildListProjectsScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.projects);
    return result;
  }

  async getProject(idOrName: string): Promise<ProjectJSON> {
    const cacheKey = `projects:get:${idOrName}`;
    const cached = this.cache.get<ProjectJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<ProjectJSON>(buildGetProjectScript(idOrName));
    this.cache.set(cacheKey, result, config.cacheTTL.projects);
    return result;
  }

  async createProject(args: CreateProjectArgs): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildCreateProjectScript(args));
    this.cache.invalidatePrefix("projects:");
    this.cache.invalidatePrefix("folders:");
    return result;
  }

  async updateProject(args: UpdateProjectArgs): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildUpdateProjectScript(args));
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  async completeProject(id: string): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildCompleteProjectScript(id));
    this.cache.invalidatePrefix("projects:");
    this.cache.invalidatePrefix("tasks:");
    return result;
  }

  async deleteProject(id: string): Promise<{ deleted: boolean; id: string }> {
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteProjectScript(id));
    this.cache.invalidatePrefix("projects:");
    this.cache.invalidatePrefix("tasks:");
    this.cache.invalidatePrefix("folders:");
    return result;
  }

  async getReviewQueue(): Promise<ProjectJSON[]> {
    return runOmniJSJson<ProjectJSON[]>(buildGetReviewQueueScript());
  }

  async markReviewed(id: string): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildMarkReviewedScript(id));
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  // ─── Folders ──────────────────────────────────────────────────────

  async listFolders(): Promise<FolderJSON[]> {
    const cacheKey = "folders:list";
    const cached = this.cache.get<FolderJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<FolderJSON[]>(buildListFoldersScript());
    this.cache.set(cacheKey, result, config.cacheTTL.folders);
    return result;
  }

  async createFolder(args: CreateFolderArgs): Promise<FolderJSON> {
    const result = await runOmniJSJson<FolderJSON>(buildCreateFolderScript(args));
    this.cache.invalidatePrefix("folders:");
    return result;
  }

  async updateFolder(args: UpdateFolderArgs): Promise<FolderJSON> {
    const result = await runOmniJSJson<FolderJSON>(buildUpdateFolderScript(args));
    this.cache.invalidatePrefix("folders:");
    return result;
  }

  async deleteFolder(id: string): Promise<{ deleted: boolean; id: string }> {
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteFolderScript(id));
    this.cache.invalidatePrefix("folders:");
    this.cache.invalidatePrefix("projects:");
    return result;
  }

  // ─── Tags ─────────────────────────────────────────────────────────

  async listTags(): Promise<TagJSON[]> {
    const cacheKey = "tags:list";
    const cached = this.cache.get<TagJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TagJSON[]>(buildListTagsScript());
    this.cache.set(cacheKey, result, config.cacheTTL.tags);
    return result;
  }

  async createTag(args: CreateTagArgs): Promise<TagJSON> {
    const result = await runOmniJSJson<TagJSON>(buildCreateTagScript(args));
    this.cache.invalidatePrefix("tags:");
    return result;
  }

  async updateTag(args: UpdateTagArgs): Promise<TagJSON> {
    const result = await runOmniJSJson<TagJSON>(buildUpdateTagScript(args));
    this.cache.invalidatePrefix("tags:");
    return result;
  }

  async deleteTag(id: string): Promise<{ deleted: boolean; id: string }> {
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteTagScript(id));
    this.cache.invalidatePrefix("tags:");
    this.cache.invalidatePrefix("tasks:");
    return result;
  }

  // ─── Perspectives ─────────────────────────────────────────────────

  async listPerspectives(): Promise<PerspectiveJSON[]> {
    const cacheKey = "perspectives:list";
    const cached = this.cache.get<PerspectiveJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<PerspectiveJSON[]>(buildListPerspectivesScript());
    this.cache.set(cacheKey, result, config.cacheTTL.perspectives);
    return result;
  }

  async getPerspectiveTasks(name: string): Promise<TaskJSON[]> {
    return runOmniJSJson<TaskJSON[]>(buildGetPerspectiveTasksScript(name));
  }

  // ─── Cache management ─────────────────────────────────────────────

  invalidateCache(prefix?: string): void {
    if (prefix) {
      this.cache.invalidatePrefix(prefix);
    } else {
      this.cache.invalidateAll();
    }
  }
}
