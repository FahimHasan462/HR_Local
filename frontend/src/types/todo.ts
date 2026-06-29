export type TodoCut = {
  cut: string;
  status: string;
  url: string;
};

export type TodoGrouped = Record<string, Record<string, TodoCut[]>>;

export type TodoStatusCount = {
  key: string;
  label: string;
  count: number;
};

export type TodoArtistEpisodeSummary = {
  employeeId: string | null;
  name: string;
  sheetName: string;
  total: number;
  statuses: TodoStatusCount[];
  cuts: TodoCut[];
};

export type TodoEpisodeOverview = {
  statuses: Pick<TodoStatusCount, "key" | "label">[];
  artists: TodoArtistEpisodeSummary[];
};

export type TodoOverview = {
  projects: Record<string, Record<string, TodoEpisodeOverview>>;
};

export type SheetConfig = {
  _id: string;
  project: string;
  episode: string;
  sheetUrl: string;
};
