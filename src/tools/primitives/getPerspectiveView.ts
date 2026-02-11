import { executeOmniFocusScript } from '../../utils/scriptExecution.js';

export interface GetPerspectiveViewParams {
  perspectiveName: string;
  limit?: number;
  includeMetadata?: boolean;
  fields?: string[];
}

interface PerspectiveViewResult {
  success: boolean;
  items?: any[];
  perspectiveName?: string;
  note?: string;
  error?: string;
}

export async function getPerspectiveView(params: GetPerspectiveViewParams): Promise<PerspectiveViewResult> {
  const { perspectiveName, limit = 100, fields } = params;

  const tempFile = `/tmp/omnifocus_perspective_${Date.now()}.js`;

  try {
    const omniScript = generatePerspectiveScript(perspectiveName, limit);

    const fs = await import('fs');
    fs.writeFileSync(tempFile, omniScript);

    let result: any;
    try {
      result = await executeOmniFocusScript(tempFile);
    } finally {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    }

    if (result.error) {
      return { success: false, error: result.error };
    }

    let items = result.items || [];

    // Apply field filtering if specified
    if (fields && fields.length > 0) {
      items = items.map((item: any) => {
        const filtered: any = {};
        fields.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
    }

    return {
      success: true,
      items: items,
      perspectiveName: result.perspectiveName || perspectiveName,
      note: result.note
    };

  } catch (error) {
    console.error('Error getting perspective view:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function generatePerspectiveScript(perspectiveName: string, limit: number): string {
  const safeName = perspectiveName
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  const normalizedName = perspectiveName.toLowerCase();

  return `(() => {
  try {
    function formatDate(date) {
      if (!date) return null;
      return date.toISOString();
    }

    function getTaskDetails(task) {
      var statusMap = {};
      statusMap[Task.Status.Available] = "Available";
      statusMap[Task.Status.Blocked] = "Blocked";
      statusMap[Task.Status.Completed] = "Completed";
      statusMap[Task.Status.Dropped] = "Dropped";
      statusMap[Task.Status.DueSoon] = "DueSoon";
      statusMap[Task.Status.Next] = "Next";
      statusMap[Task.Status.Overdue] = "Overdue";

      var details = {
        id: task.id.primaryKey,
        name: task.name,
        completed: task.completed,
        flagged: task.flagged,
        note: task.note || "",
        dueDate: formatDate(task.dueDate),
        deferDate: formatDate(task.deferDate),
        completionDate: formatDate(task.completionDate),
        estimatedMinutes: task.estimatedMinutes,
        taskStatus: statusMap[task.taskStatus] || "Unknown",
        projectName: task.containingProject ? task.containingProject.name : null,
        tagNames: task.tags.map(function(tag) { return tag.name; })
      };

      return details;
    }

    function getProjectDetails(project) {
      return {
        id: project.id.primaryKey,
        name: project.name,
        type: "project",
        status: project.status,
        note: project.note || "",
        flagged: project.flagged || false,
        dueDate: formatDate(project.dueDate),
        deferDate: formatDate(project.deferDate),
        folderName: project.parentFolder ? project.parentFolder.name : null
      };
    }

    var items = [];
    var note = null;
    var perspectiveName = "${safeName}";
    var limit = ${limit};

    ${generatePerspectiveBranch(normalizedName, safeName)}

    return JSON.stringify({
      success: true,
      perspectiveName: perspectiveName,
      items: items.slice(0, limit),
      note: note
    });

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.toString()
    });
  }
})()`;
}

function generatePerspectiveBranch(normalizedName: string, safeName: string): string {
  switch (normalizedName) {
    case 'inbox':
      return `
    // Inbox: tasks not yet assigned to a project
    inbox.forEach(function(task) {
      items.push(getTaskDetails(task));
    });`;

    case 'projects':
      return `
    // Projects: active projects
    flattenedProjects.forEach(function(project) {
      if (project.status === Project.Status.Active) {
        items.push(getProjectDetails(project));
      }
    });`;

    case 'tags':
      return `
    // Tags: remaining tasks across all tags, deduplicated
    var seenIds = {};
    flattenedTags.forEach(function(tag) {
      tag.remainingTasks.forEach(function(task) {
        var taskId = task.id.primaryKey;
        if (!seenIds[taskId]) {
          seenIds[taskId] = true;
          items.push(getTaskDetails(task));
        }
      });
    });`;

    case 'flagged':
      return `
    // Flagged: flagged, incomplete tasks
    flattenedTasks.forEach(function(task) {
      if (task.flagged && !task.completed) {
        items.push(getTaskDetails(task));
      }
    });`;

    case 'forecast':
      return `
    // Forecast: tasks due within the next 7 days (including overdue), sorted by due date
    var now = new Date();
    var windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 7);
    flattenedTasks.forEach(function(task) {
      if (!task.completed && task.dueDate && task.dueDate <= windowEnd) {
        items.push(getTaskDetails(task));
      }
    });
    items.sort(function(a, b) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });`;

    case 'review':
      return `
    // Review: active projects whose next review date has passed
    var now = new Date();
    flattenedProjects.forEach(function(project) {
      if (project.status === Project.Status.Active) {
        var nextReview = project.nextReviewDate;
        if (nextReview && nextReview <= now) {
          var details = getProjectDetails(project);
          details.nextReviewDate = formatDate(nextReview);
          details.lastReviewDate = formatDate(project.lastReviewDate);
          items.push(details);
        }
      }
    });`;

    default:
      // Custom perspective: look it up, inform user of limitations
      return `
    // Custom perspective: attempt to find it
    var customPerspective = null;
    try {
      var allCustom = Perspective.Custom.all;
      for (var i = 0; i < allCustom.length; i++) {
        if (allCustom[i].name.toLowerCase() === "${safeName.toLowerCase()}") {
          customPerspective = allCustom[i];
          break;
        }
      }
    } catch (e) {}

    if (customPerspective) {
      // Found the custom perspective but cannot read its filter rules programmatically.
      return JSON.stringify({
        success: true,
        perspectiveName: perspectiveName,
        items: [],
        note: "Custom perspective '" + perspectiveName + "' exists but its filter rules cannot be read programmatically via the OmniFocus automation API. Use the query_omnifocus tool with specific filters (tags, project, status, flagged, dueWithin) to replicate its behavior."
      });
    } else {
      // Perspective not found - fall back to available tasks with a note
      note = "Perspective '" + perspectiveName + "' was not found. Showing all available tasks as a fallback. Use list_perspectives to see available perspective names.";
      flattenedTasks.forEach(function(task) {
        if (task.taskStatus === Task.Status.Available && !task.completed) {
          items.push(getTaskDetails(task));
        }
      });
    }`;
  }
}
