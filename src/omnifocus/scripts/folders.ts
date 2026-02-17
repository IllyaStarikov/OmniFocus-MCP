import { serializeFolderFn } from "../serializers.js";
import type { CreateFolderArgs, UpdateFolderArgs } from "../../types/omnifocus.js";

export function buildListFoldersScript(): string {
  return `(() => {
  ${serializeFolderFn}

  var folders = document.flattenedFolders.slice();
  return JSON.stringify(folders.map(serializeFolder));
})()`;
}

export function buildCreateFolderScript(args: CreateFolderArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeFolderFn}

  var parent = null;
  if (args.parentFolderId) {
    parent = document.flattenedFolders.byId(args.parentFolderId);
    if (!parent) throw new Error("Parent folder not found: " + args.parentFolderId);
  } else if (args.parentFolderName) {
    var matches = document.flattenedFolders.filter(function(f) { return f.name === args.parentFolderName; });
    if (matches.length === 0) throw new Error("Parent folder not found: " + args.parentFolderName);
    parent = matches[0];
  }

  var folder = new Folder(args.name, parent ? parent.ending : document.portfolios[0].ending);
  return JSON.stringify(serializeFolder(folder));
})()`;
}

export function buildUpdateFolderScript(args: UpdateFolderArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeFolderFn}

  var folder = document.flattenedFolders.byId(args.id);
  if (!folder) throw new Error("Folder not found: " + args.id);

  if (args.name !== undefined) folder.name = args.name;

  return JSON.stringify(serializeFolder(folder));
})()`;
}

export function buildDeleteFolderScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});

  var folder = document.flattenedFolders.byId(args.id);
  if (!folder) throw new Error("Folder not found: " + args.id);
  deleteObject(folder);
  return JSON.stringify({ deleted: true, id: args.id });
})()`;
}
