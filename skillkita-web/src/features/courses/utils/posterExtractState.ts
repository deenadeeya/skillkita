export type PosterExtractState =
  | { status: "idle" }
  | { status: "running"; progressLabel: string; progressPct: number }
  | { status: "done" }
  | { status: "error"; message: string };
