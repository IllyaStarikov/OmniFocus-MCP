import type { TaskNotificationJSON } from "../../src/types/omnifocus.js";

export const mockAbsoluteNotification: TaskNotificationJSON = {
  id: "notif-1",
  kind: "absolute",
  absoluteFireDate: "2024-12-20T09:00:00.000Z",
  relativeFireOffset: null,
  nextFireDate: "2024-12-20T09:00:00.000Z",
  isSnoozed: false,
};

export const mockDueRelativeNotification: TaskNotificationJSON = {
  id: "notif-2",
  kind: "dueRelative",
  absoluteFireDate: null,
  relativeFireOffset: -3600,
  nextFireDate: "2024-12-20T16:00:00.000Z",
  isSnoozed: false,
};
