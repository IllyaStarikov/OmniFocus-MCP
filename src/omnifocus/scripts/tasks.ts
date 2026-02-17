import { serializeTaskFn, serializeTaskWithChildrenFn, serializeTaskNotificationFn, serializeProjectFn } from "../serializers.js";
import type { ListTasksArgs, CreateTaskArgs, UpdateTaskArgs, GetTaskArgs, MoveTasksArgs, DuplicateTasksArgs, SetTaskTagsArgs, AddTaskNotificationArgs, BatchCreateTasksArgs, BatchDeleteTasksArgs, BatchCompleteTasksArgs } from "../../types/omnifocus.js";

// Shared filter logic used by both buildListTasksScript and buildGetTaskCountScript
const taskFilterLogicFn = `
  var tasks;
  if (args.inInbox) {
    tasks = inbox.slice();
  } else {
    tasks = flattenedTasks.slice();
  }

  // Filter by taskStatus
  if (args.taskStatus === "available") {
    tasks = tasks.filter(function(t) { return t.taskStatus === Task.Status.Available; });
  } else if (args.taskStatus === "remaining") {
    tasks = tasks.filter(function(t) { return t.taskStatus === Task.Status.Available || t.taskStatus === Task.Status.Blocked; });
  } else if (args.taskStatus === "completed") {
    tasks = tasks.filter(function(t) { return t.taskStatus === Task.Status.Completed; });
  } else if (args.taskStatus === "dropped") {
    tasks = tasks.filter(function(t) { return t.taskStatus === Task.Status.Dropped; });
  } else if (args.completed === true) {
    tasks = tasks.filter(function(t) { return t.taskStatus === Task.Status.Completed; });
  } else if (args.completed === false) {
    tasks = tasks.filter(function(t) { return t.taskStatus !== Task.Status.Completed && t.taskStatus !== Task.Status.Dropped; });
  }

  // Filter by flagged
  if (args.flagged === true) {
    tasks = tasks.filter(function(t) { return t.flagged; });
  } else if (args.flagged === false) {
    tasks = tasks.filter(function(t) { return !t.flagged; });
  }

  // Filter by available
  if (args.available === true) {
    tasks = tasks.filter(function(t) { return t.taskStatus === Task.Status.Available; });
  }

  // Filter by project ID
  if (args.projectId) {
    tasks = tasks.filter(function(t) {
      return t.containingProject && t.containingProject.id.primaryKey === args.projectId;
    });
  }

  // Filter by project name
  if (args.projectName) {
    tasks = tasks.filter(function(t) {
      return t.containingProject && t.containingProject.name === args.projectName;
    });
  }

  // Filter by tag names
  if (args.tagNames && args.tagNames.length > 0) {
    tasks = tasks.filter(function(t) {
      var taskTagNames = t.tags.map(function(tg) { return tg.name; });
      return args.tagNames.every(function(tn) { return taskTagNames.indexOf(tn) !== -1; });
    });
  }

  // Filter by due date range
  if (args.dueAfter) {
    var dueAfter = new Date(args.dueAfter);
    tasks = tasks.filter(function(t) { return t.dueDate && t.dueDate >= dueAfter; });
  }
  if (args.dueBefore) {
    var dueBefore = new Date(args.dueBefore);
    tasks = tasks.filter(function(t) { return t.dueDate && t.dueDate <= dueBefore; });
  }

  // Filter by defer date range
  if (args.deferAfter) {
    var deferAfter = new Date(args.deferAfter);
    tasks = tasks.filter(function(t) { return t.deferDate && t.deferDate >= deferAfter; });
  }
  if (args.deferBefore) {
    var deferBefore = new Date(args.deferBefore);
    tasks = tasks.filter(function(t) { return t.deferDate && t.deferDate <= deferBefore; });
  }

  // Filter by search query
  if (args.search) {
    var query = args.search.toLowerCase();
    tasks = tasks.filter(function(t) {
      return t.name.toLowerCase().indexOf(query) !== -1 || (t.note || "").toLowerCase().indexOf(query) !== -1;
    });
  }`;

export function buildListTasksScript(args: ListTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}
  ${taskFilterLogicFn}

  // Pagination
  var offset = args.offset || 0;
  var limit = args.limit || 100;
  tasks = tasks.slice(offset, offset + limit);

  return JSON.stringify(tasks.map(serializeTask));
})()`;
}

export function buildGetTaskCountScript(args: ListTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${taskFilterLogicFn}

  return JSON.stringify({ count: tasks.length });
})()`;
}

export function buildGetTaskScript(args: string | GetTaskArgs): string {
  const normalized = typeof args === "string" ? { id: args } : args;
  const argsJson = JSON.stringify(normalized);

  if (normalized.includeChildren) {
    return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}
  ${serializeTaskWithChildrenFn}

  var task = flattenedTasks.byId(args.id);
  if (!task) {
    throw new Error("Task not found: " + args.id);
  }
  return JSON.stringify(serializeTaskWithChildren(task, 0, args.maxDepth || 0));
})()`;
  }

  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.id);
  if (!task) {
    throw new Error("Task not found: " + args.id);
  }
  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildCreateTaskScript(args: CreateTaskArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = new Task(args.name, inbox.ending);

  if (args.note !== undefined) task.note = args.note;
  if (args.flagged !== undefined) task.flagged = args.flagged;
  if (args.deferDate) task.deferDate = new Date(args.deferDate);
  if (args.dueDate) task.dueDate = new Date(args.dueDate);
  if (args.estimatedMinutes !== undefined) task.estimatedMinutes = args.estimatedMinutes;
  if (args.completedByChildren !== undefined) task.completedByChildren = args.completedByChildren;

  if (args.repetitionRule) {
    var methodMap = { "fixed": Task.RepetitionMethod.Fixed, "startAfterCompletion": Task.RepetitionMethod.StartAfterCompletion, "dueAfterCompletion": Task.RepetitionMethod.DueAfterCompletion };
    task.repetitionRule = new Task.RepetitionRule(args.repetitionRule.ruleString, methodMap[args.repetitionRule.method] || Task.RepetitionMethod.Fixed);
  }

  if (args.projectId) {
    var project = flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    moveTasks([task], project.ending);
  } else if (args.projectName) {
    var projects = flattenedProjects.filter(function(p) { return p.name === args.projectName; });
    if (projects.length === 0) throw new Error("Project not found: " + args.projectName);
    moveTasks([task], projects[0].ending);
  }

  if (args.tags && args.tags.length > 0) {
    args.tags.forEach(function(tagName) {
      var matches = flattenedTags.filter(function(t) { return t.name === tagName; });
      if (matches.length > 0) {
        task.addTag(matches[0]);
      } else {
        var newTag = new Tag(tagName);
        tags.push(newTag);
        task.addTag(newTag);
      }
    });
  }

  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildUpdateTaskScript(args: UpdateTaskArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);

  if (args.name !== undefined) task.name = args.name;
  if (args.note !== undefined) task.note = args.note;
  if (args.flagged !== undefined) task.flagged = args.flagged;
  if (args.deferDate !== undefined) task.deferDate = args.deferDate ? new Date(args.deferDate) : null;
  if (args.dueDate !== undefined) task.dueDate = args.dueDate ? new Date(args.dueDate) : null;
  if (args.estimatedMinutes !== undefined) task.estimatedMinutes = args.estimatedMinutes;
  if (args.sequential !== undefined) task.sequential = args.sequential;
  if (args.completedByChildren !== undefined) task.completedByChildren = args.completedByChildren;

  if (args.repetitionRule !== undefined) {
    if (args.repetitionRule === null) {
      task.repetitionRule = null;
    } else {
      var methodMap = { "fixed": Task.RepetitionMethod.Fixed, "startAfterCompletion": Task.RepetitionMethod.StartAfterCompletion, "dueAfterCompletion": Task.RepetitionMethod.DueAfterCompletion };
      task.repetitionRule = new Task.RepetitionRule(args.repetitionRule.ruleString, methodMap[args.repetitionRule.method] || Task.RepetitionMethod.Fixed);
    }
  }

  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildCompleteTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);
  task.markComplete();
  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildUncompleteTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);
  task.markIncomplete();
  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildDropTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);
  task.drop(false);
  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildDeleteTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});

  var task = flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);
  deleteObject(task);
  return JSON.stringify({ deleted: true, id: args.id });
})()`;
}

export function buildMoveTasksScript(args: MoveTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var tasks = args.taskIds.map(function(id) {
    var t = flattenedTasks.byId(id);
    if (!t) throw new Error("Task not found: " + id);
    return t;
  });

  var destination;
  if (args.parentTaskId) {
    var parentTask = flattenedTasks.byId(args.parentTaskId);
    if (!parentTask) throw new Error("Parent task not found: " + args.parentTaskId);
    destination = parentTask.ending;
  } else if (args.projectId) {
    var project = flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    destination = project.ending;
  } else if (args.projectName) {
    var projects = flattenedProjects.filter(function(p) { return p.name === args.projectName; });
    if (projects.length === 0) throw new Error("Project not found: " + args.projectName);
    destination = projects[0].ending;
  } else {
    destination = inbox.ending;
  }

  moveTasks(tasks, destination);
  return JSON.stringify(tasks.map(serializeTask));
})()`;
}

export function buildDuplicateTasksScript(args: DuplicateTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var tasks = args.taskIds.map(function(id) {
    var t = flattenedTasks.byId(id);
    if (!t) throw new Error("Task not found: " + id);
    return t;
  });

  var destination;
  if (args.projectId) {
    var project = flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    destination = project.ending;
  } else if (args.projectName) {
    var projects = flattenedProjects.filter(function(p) { return p.name === args.projectName; });
    if (projects.length === 0) throw new Error("Project not found: " + args.projectName);
    destination = projects[0].ending;
  } else {
    destination = inbox.ending;
  }

  var duplicated = duplicateTasks(tasks, destination);
  return JSON.stringify(duplicated.map(serializeTask));
})()`;
}

export function buildSetTaskTagsScript(args: SetTaskTagsArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);

  function findOrCreateTag(name) {
    var matches = flattenedTags.filter(function(t) { return t.name === name; });
    if (matches.length > 0) return matches[0];
    var newTag = new Tag(name);
    tags.push(newTag);
    return newTag;
  }

  if (args.mode === "replace") {
    task.clearTags();
    args.tagNames.forEach(function(name) {
      task.addTag(findOrCreateTag(name));
    });
  } else if (args.mode === "add") {
    args.tagNames.forEach(function(name) {
      task.addTag(findOrCreateTag(name));
    });
  } else if (args.mode === "remove") {
    args.tagNames.forEach(function(name) {
      var matches = flattenedTags.filter(function(t) { return t.name === name; });
      if (matches.length > 0) task.removeTag(matches[0]);
    });
  }

  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildAddTaskNotificationScript(args: AddTaskNotificationArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);

  if (args.type === "absolute") {
    if (!args.absoluteDate) throw new Error("absoluteDate is required for absolute notifications");
    task.addNotification(new Date(args.absoluteDate));
  } else if (args.type === "dueRelative") {
    if (args.relativeOffset === undefined) throw new Error("relativeOffset is required for dueRelative notifications");
    task.addNotification(args.relativeOffset);
  } else if (args.type === "deferRelative") {
    if (args.relativeOffset === undefined) throw new Error("relativeOffset is required for deferRelative notifications");
    var notif = task.addNotification(0);
    notif.kind = Notification.Kind.DeferDate;
    notif.relativeFireDate = args.relativeOffset;
  }

  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildAppendTaskNoteScript(taskId: string, text: string): string {
  const argsJson = JSON.stringify({ taskId, text });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);
  task.appendStringToNote(args.text);
  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildConvertTaskToProjectScript(taskId: string): string {
  const argsJson = JSON.stringify({ taskId });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var task = flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);
  var projects = convertTasksToProjects([task]);
  if (projects.length === 0) throw new Error("Failed to convert task to project");
  return JSON.stringify(serializeProject(projects[0]));
})()`;
}

export function buildGetTodayCompletedTasksScript(): string {
  return `(() => {
  ${serializeTaskFn}

  var now = new Date();
  var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var tasks = flattenedTasks.filter(function(t) {
    return t.taskStatus === Task.Status.Completed && t.completionDate && t.completionDate >= startOfDay;
  });
  return JSON.stringify(tasks.map(serializeTask));
})()`;
}

export function buildListTaskNotificationsScript(taskId: string): string {
  const argsJson = JSON.stringify({ taskId });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskNotificationFn}

  var task = flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);

  return JSON.stringify(task.notifications.map(serializeTaskNotification));
})()`;
}

export function buildRemoveTaskNotificationScript(taskId: string, notificationId: string): string {
  const argsJson = JSON.stringify({ taskId, notificationId });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});

  var task = flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);

  var notif = null;
  for (var i = 0; i < task.notifications.length; i++) {
    if (task.notifications[i].id.primaryKey === args.notificationId) {
      notif = task.notifications[i];
      break;
    }
  }
  if (!notif) throw new Error("Notification not found: " + args.notificationId);

  task.removeNotification(notif);
  return JSON.stringify({ removed: true, taskId: args.taskId, notificationId: args.notificationId });
})()`;
}

export function buildBatchCreateTasksScript(args: BatchCreateTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  function findOrCreateTag(name) {
    var matches = flattenedTags.filter(function(t) { return t.name === name; });
    if (matches.length > 0) return matches[0];
    var newTag = new Tag(name);
    tags.push(newTag);
    return newTag;
  }

  function createTaskFromItem(item, parentLocation) {
    var task = new Task(item.name, parentLocation);

    if (item.note !== undefined) task.note = item.note;
    if (item.flagged !== undefined) task.flagged = item.flagged;
    if (item.deferDate) task.deferDate = new Date(item.deferDate);
    if (item.dueDate) task.dueDate = new Date(item.dueDate);
    if (item.estimatedMinutes !== undefined) task.estimatedMinutes = item.estimatedMinutes;
    if (item.completedByChildren !== undefined) task.completedByChildren = item.completedByChildren;

    if (item.repetitionRule) {
      var methodMap = { "fixed": Task.RepetitionMethod.Fixed, "startAfterCompletion": Task.RepetitionMethod.StartAfterCompletion, "dueAfterCompletion": Task.RepetitionMethod.DueAfterCompletion };
      task.repetitionRule = new Task.RepetitionRule(item.repetitionRule.ruleString, methodMap[item.repetitionRule.method] || Task.RepetitionMethod.Fixed);
    }

    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(function(tagName) { task.addTag(findOrCreateTag(tagName)); });
    }

    if (item.children && item.children.length > 0) {
      item.children.forEach(function(child) {
        createTaskFromItem(child, task.ending);
      });
    }

    return task;
  }

  var destination;
  if (args.parentTaskId) {
    var parentTask = flattenedTasks.byId(args.parentTaskId);
    if (!parentTask) throw new Error("Parent task not found: " + args.parentTaskId);
    destination = parentTask.ending;
  } else if (args.projectId) {
    var project = flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    destination = project.ending;
  } else if (args.projectName) {
    var projects = flattenedProjects.filter(function(p) { return p.name === args.projectName; });
    if (projects.length === 0) throw new Error("Project not found: " + args.projectName);
    destination = projects[0].ending;
  } else {
    destination = inbox.ending;
  }

  var created = args.tasks.map(function(item) {
    return createTaskFromItem(item, destination);
  });

  return JSON.stringify(created.map(serializeTask));
})()`;
}

export function buildBatchDeleteTasksScript(args: BatchDeleteTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  var results = [];
  args.taskIds.forEach(function(id) {
    var task = flattenedTasks.byId(id);
    if (!task) throw new Error("Task not found: " + id);
    deleteObject(task);
    results.push({ deleted: true, id: id });
  });
  return JSON.stringify(results);
})()`;
}

export function buildBatchCompleteTasksScript(args: BatchCompleteTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}
  var results = [];
  args.taskIds.forEach(function(id) {
    var task = flattenedTasks.byId(id);
    if (!task) throw new Error("Task not found: " + id);
    task.markComplete();
    results.push(serializeTask(task));
  });
  return JSON.stringify(results);
})()`;
}
