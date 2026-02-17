import { serializeTaskFn } from "../serializers.js";
import type { ListTasksArgs, CreateTaskArgs, UpdateTaskArgs, MoveTasksArgs, DuplicateTasksArgs, SetTaskTagsArgs, AddTaskNotificationArgs } from "../../types/omnifocus.js";

export function buildListTasksScript(args: ListTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var tasks;
  if (args.inInbox) {
    tasks = document.inboxTasks.slice();
  } else {
    tasks = document.flattenedTasks.slice();
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
      return t.name.toLowerCase().indexOf(query) !== -1 || t.note.toLowerCase().indexOf(query) !== -1;
    });
  }

  // Pagination
  var offset = args.offset || 0;
  var limit = args.limit || 100;
  tasks = tasks.slice(offset, offset + limit);

  return JSON.stringify(tasks.map(serializeTask));
})()`;
}

export function buildGetTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = document.flattenedTasks.byId(args.id);
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

  if (args.projectId) {
    var project = document.flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    moveTasks([task], project.ending);
  } else if (args.projectName) {
    var projects = document.flattenedProjects.filter(function(p) { return p.name === args.projectName; });
    if (projects.length === 0) throw new Error("Project not found: " + args.projectName);
    moveTasks([task], projects[0].ending);
  }

  if (args.tags && args.tags.length > 0) {
    args.tags.forEach(function(tagName) {
      var matches = document.flattenedTags.filter(function(t) { return t.name === tagName; });
      if (matches.length > 0) {
        task.addTag(matches[0]);
      } else {
        var newTag = new Tag(tagName);
        document.tags.push(newTag);
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

  var task = document.flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);

  if (args.name !== undefined) task.name = args.name;
  if (args.note !== undefined) task.note = args.note;
  if (args.flagged !== undefined) task.flagged = args.flagged;
  if (args.deferDate !== undefined) task.deferDate = args.deferDate ? new Date(args.deferDate) : null;
  if (args.dueDate !== undefined) task.dueDate = args.dueDate ? new Date(args.dueDate) : null;
  if (args.estimatedMinutes !== undefined) task.estimatedMinutes = args.estimatedMinutes;

  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildCompleteTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var task = document.flattenedTasks.byId(args.id);
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

  var task = document.flattenedTasks.byId(args.id);
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

  var task = document.flattenedTasks.byId(args.id);
  if (!task) throw new Error("Task not found: " + args.id);
  task.drop(false);
  return JSON.stringify(serializeTask(task));
})()`;
}

export function buildDeleteTaskScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});

  var task = document.flattenedTasks.byId(args.id);
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
    var t = document.flattenedTasks.byId(id);
    if (!t) throw new Error("Task not found: " + id);
    return t;
  });

  var destination;
  if (args.parentTaskId) {
    var parentTask = document.flattenedTasks.byId(args.parentTaskId);
    if (!parentTask) throw new Error("Parent task not found: " + args.parentTaskId);
    destination = parentTask.ending;
  } else if (args.projectId) {
    var project = document.flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    destination = project.ending;
  } else if (args.projectName) {
    var projects = document.flattenedProjects.filter(function(p) { return p.name === args.projectName; });
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
    var t = document.flattenedTasks.byId(id);
    if (!t) throw new Error("Task not found: " + id);
    return t;
  });

  var destination;
  if (args.projectId) {
    var project = document.flattenedProjects.byId(args.projectId);
    if (!project) throw new Error("Project not found: " + args.projectId);
    destination = project.ending;
  } else if (args.projectName) {
    var projects = document.flattenedProjects.filter(function(p) { return p.name === args.projectName; });
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

  var task = document.flattenedTasks.byId(args.taskId);
  if (!task) throw new Error("Task not found: " + args.taskId);

  function findOrCreateTag(name) {
    var matches = document.flattenedTags.filter(function(t) { return t.name === name; });
    if (matches.length > 0) return matches[0];
    var newTag = new Tag(name);
    document.tags.push(newTag);
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
      var tag = findOrCreateTag(name);
      task.removeTag(tag);
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

  var task = document.flattenedTasks.byId(args.taskId);
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
