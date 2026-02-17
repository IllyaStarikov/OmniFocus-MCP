import { serializePerspectiveFn, serializeTaskFn } from "../serializers.js";

export function buildListPerspectivesScript(): string {
  return `(() => {
  ${serializePerspectiveFn}

  var perspectives = document.perspectives.slice();
  return JSON.stringify(perspectives.map(serializePerspective));
})()`;
}

export function buildGetPerspectiveTasksScript(name: string): string {
  const argsJson = JSON.stringify({ name });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var perspectives = document.perspectives.filter(function(p) { return p.name === args.name; });
  if (perspectives.length === 0) throw new Error("Perspective not found: " + args.name);

  var win = document.windows[0];
  if (!win) throw new Error("No OmniFocus window available");

  win.perspective = perspectives[0];

  // Wait briefly for perspective to load, then read content
  var content = win.content;
  if (!content || !content.trees || content.trees.length === 0) {
    return JSON.stringify([]);
  }

  var tasks = [];
  function collectTasks(trees) {
    for (var i = 0; i < trees.length; i++) {
      var node = trees[i];
      if (node.value && node.value.constructor === Task) {
        tasks.push(serializeTask(node.value));
      }
      if (node.children && node.children.length > 0) {
        collectTasks(node.children);
      }
    }
  }
  collectTasks(content.trees);

  return JSON.stringify(tasks);
})()`;
}
