import { serializePerspectiveFn, serializeTaskFn } from "../serializers.js";
import type { ListPerspectivesArgs } from "../../types/omnifocus.js";

export function buildListPerspectivesScript(args: ListPerspectivesArgs = {}): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializePerspectiveFn}

  var builtInNames = ["Inbox","Projects","Tags","Forecast","Flagged","Review","Nearby"];
  var perspectives = Perspective.Custom.all.slice();
  if (args.includeBuiltIn === false) {
    perspectives = perspectives.filter(function(p) { return builtInNames.indexOf(p.name) === -1; });
  }
  if (args.includeCustom === false) {
    perspectives = perspectives.filter(function(p) { return builtInNames.indexOf(p.name) !== -1; });
  }
  return JSON.stringify(perspectives.map(serializePerspective));
})()`;
}

export function buildGetPerspectiveTasksScript(name: string): string {
  const argsJson = JSON.stringify({ name });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var perspectives = Perspective.Custom.all.filter(function(p) { return p.name === args.name; });
  if (perspectives.length === 0) throw new Error("Perspective not found: " + args.name);

  var win = document.windows[0];
  if (!win) throw new Error("No OmniFocus window available");

  // NOTE: This mutates the user's active OmniFocus window by changing its perspective.
  // Save and restore the original perspective to minimize disruption.
  var originalPerspective = win.perspective;
  win.perspective = perspectives[0];

  // Read content after perspective switch
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

  // Restore the original perspective
  if (originalPerspective) win.perspective = originalPerspective;

  return JSON.stringify(tasks);
})()`;
}
