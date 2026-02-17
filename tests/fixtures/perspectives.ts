import type { PerspectiveJSON } from "../../src/types/omnifocus.js";

export const mockPerspective: PerspectiveJSON = {
  id: "persp-1",
  name: "Due Soon",
};

export const mockPerspectiveList: PerspectiveJSON[] = [
  mockPerspective,
  { id: "persp-2", name: "Flagged" },
  { id: "persp-3", name: "Forecast" },
];
