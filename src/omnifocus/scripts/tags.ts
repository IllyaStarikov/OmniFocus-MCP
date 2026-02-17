import { serializeTagFn, serializeTagWithChildrenFn } from "../serializers.js";
import type { CreateTagArgs, UpdateTagArgs } from "../../types/omnifocus.js";

export function buildListTagsScript(): string {
  return `(() => {
  ${serializeTagFn}

  var tags = flattenedTags.slice();
  return JSON.stringify(tags.map(serializeTag));
})()`;
}

export function buildGetTagScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTagFn}
  ${serializeTagWithChildrenFn}

  var tag = flattenedTags.byId(args.id);
  if (!tag) throw new Error("Tag not found: " + args.id);
  return JSON.stringify(serializeTagWithChildren(tag));
})()`;
}

export function buildCreateTagScript(args: CreateTagArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTagFn}

  var parent = null;
  if (args.parentTagId) {
    parent = flattenedTags.byId(args.parentTagId);
    if (!parent) throw new Error("Parent tag not found: " + args.parentTagId);
  } else if (args.parentTagName) {
    var matches = flattenedTags.filter(function(t) { return t.name === args.parentTagName; });
    if (matches.length === 0) throw new Error("Parent tag not found: " + args.parentTagName);
    parent = matches[0];
  }

  var tag;
  if (parent) {
    tag = new Tag(args.name, parent.ending);
  } else {
    tag = new Tag(args.name);
    tags.push(tag);
  }

  if (args.allowsNextAction !== undefined) {
    tag.allowsNextAction = args.allowsNextAction;
  }

  if (args.status) {
    if (args.status === "active") tag.status = Tag.Status.Active;
    else if (args.status === "onHold") tag.status = Tag.Status.OnHold;
    else if (args.status === "dropped") tag.status = Tag.Status.Dropped;
  }

  return JSON.stringify(serializeTag(tag));
})()`;
}

export function buildUpdateTagScript(args: UpdateTagArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTagFn}

  var tag = flattenedTags.byId(args.id);
  if (!tag) throw new Error("Tag not found: " + args.id);

  if (args.name !== undefined) tag.name = args.name;
  if (args.allowsNextAction !== undefined) tag.allowsNextAction = args.allowsNextAction;

  if (args.status !== undefined) {
    if (args.status === "active") tag.status = Tag.Status.Active;
    else if (args.status === "onHold") tag.status = Tag.Status.OnHold;
    else if (args.status === "dropped") tag.status = Tag.Status.Dropped;
  }

  return JSON.stringify(serializeTag(tag));
})()`;
}

export function buildDeleteTagScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});

  var tag = flattenedTags.byId(args.id);
  if (!tag) throw new Error("Tag not found: " + args.id);
  deleteObject(tag);
  return JSON.stringify({ deleted: true, id: args.id });
})()`;
}
