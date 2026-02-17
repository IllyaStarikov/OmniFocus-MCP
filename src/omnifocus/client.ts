import { runOmniJSJson } from "./executor.js";
import { Cache } from "./cache.js";
import { config } from "../config.js";
import { buildDatabaseSummaryScript, buildSearchScript } from "./scripts/database.js";
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
  ListTasksArgs,
  CreateTaskArgs,
  UpdateTaskArgs,
  MoveTasksArgs,
  DuplicateTasksArgs,
  SetTaskTagsArgs,
  AddTaskNotificationArgs,
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

  // ─── Cache management ─────────────────────────────────────────────

  invalidateCache(prefix?: string): void {
    if (prefix) {
      this.cache.invalidatePrefix(prefix);
    } else {
      this.cache.invalidateAll();
    }
  }
}
