import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "weekly-review",
    "Guided weekly review of OmniFocus projects and tasks",
    async () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Perform a weekly review of my OmniFocus system:
1. First call get_review_queue to see projects due for review
2. For each project, call get_project_tasks to check progress
3. Call get_inbox_tasks to process any unprocessed items
4. Call get_flagged_tasks to review priorities
5. Summarize: projects reviewed, inbox items processed, flagged items status
6. Mark reviewed projects with mark_reviewed
Provide a structured summary when done.`,
        },
      }],
    }),
  );

  server.prompt(
    "inbox-processing",
    "Process OmniFocus inbox using GTD methodology",
    async () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Process my OmniFocus inbox using GTD:
1. Call get_inbox_tasks to see all inbox items
2. For each item, help me decide: is it actionable?
   - If not actionable: delete or convert to reference
   - If actionable and <2 min: suggest completing it now
   - If actionable: suggest a project, tags, due/defer dates
3. Use move_tasks, update_task, set_task_tags to organize items
4. Summarize what was processed`,
        },
      }],
    }),
  );

  server.prompt(
    "daily-planning",
    "Plan today's tasks using OmniFocus data",
    async () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Help me plan my day:
1. Call get_database_summary for an overview
2. Call list_tasks with dueBefore set to end of today to find due tasks
3. Call get_flagged_tasks to see priorities
4. Call get_today_completed_tasks to see what's already done
5. Suggest a prioritized plan for the day based on due dates, flags, and estimated time`,
        },
      }],
    }),
  );
}
