import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AppHeader } from "@/components/AppHeader";
import { LinkboardNavButton } from "@/components/LinkboardNavButton";
import { CutStatusBadge } from "@/components/CutStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { TodoCut, TodoGrouped } from "@/types/todo";
import { CheckSquare, ExternalLink, FolderOpen, Loader2, Search, X } from "lucide-react";
import ManagementTodoDashboard from "@/pages/ManagementTodoDashboard";

const EPISODE_VISIBLE_ROWS = 10;
const EPISODE_ROW_HEIGHT_PX = 49;
const EPISODE_HEADER_HEIGHT_PX = 48;
const EPISODE_SCROLL_MAX_HEIGHT =
  EPISODE_HEADER_HEIGHT_PX + EPISODE_VISIBLE_ROWS * EPISODE_ROW_HEIGHT_PX;
const SCROLL_CONTAINER_CLASS =
  "overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const normalizeStatus = (status: string) => status.trim().toLowerCase();

const filterGrouped = (
  cuts: TodoGrouped,
  query: string,
  statusFilter: string | null,
): TodoGrouped => {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedStatus = statusFilter ? normalizeStatus(statusFilter) : null;
  const result: TodoGrouped = {};

  for (const [project, episodes] of Object.entries(cuts)) {
    for (const [episode, rows] of Object.entries(episodes)) {
      const matched = rows.filter((row) => {
        const matchesQuery =
          !normalizedQuery ||
          row.cut.toLowerCase().includes(normalizedQuery) ||
          row.status.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          !normalizedStatus || normalizeStatus(row.status) === normalizedStatus;
        return matchesQuery && matchesStatus;
      });

      if (matched.length === 0) continue;
      if (!result[project]) result[project] = {};
      result[project][episode] = matched;
    }
  }

  return result;
};

const countByStatus = (cuts: TodoGrouped) => {
  const counts = new Map<string, { label: string; count: number }>();

  for (const episodes of Object.values(cuts)) {
    for (const rows of Object.values(episodes)) {
      for (const row of rows) {
        const key = normalizeStatus(row.status) || "unknown";
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(key, { label: row.status.trim() || "Unknown", count: 1 });
        }
      }
    }
  }

  return [...counts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

const countCuts = (cuts: TodoGrouped) =>
  Object.values(cuts).reduce(
    (sum, episodes) => sum + Object.values(episodes).reduce((epSum, rows) => epSum + rows.length, 0),
    0,
  );

const Todo = () => {
  const { currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [cuts, setCuts] = useState<TodoGrouped>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const { ok, data } = await apiFetch<TodoGrouped>("/todo");
      if (cancelled) return;

      if (!ok) {
        setError("Could not load your cuts. Please try again.");
        setCuts({});
      } else {
        setCuts(data ?? {});
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.sheetName]);

  const searchFiltered = useMemo(() => filterGrouped(cuts, search, null), [cuts, search]);

  const filtered = useMemo(
    () => filterGrouped(cuts, search, statusFilter),
    [cuts, search, statusFilter],
  );

  const statusSummary = useMemo(() => countByStatus(searchFiltered), [searchFiltered]);
  const projectNames = Object.keys(filtered).sort();
  const totalCuts = countCuts(filtered);
  const totalBeforeStatusFilter = countCuts(searchFiltered);

  const toggleStatusFilter = (status: string) => {
    const key = normalizeStatus(status) || status;
    setStatusFilter((current) => (current === key ? null : key));
  };

  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role === "hr") return <Navigate to="/" replace />;
  if (currentUser.role === "management") return <ManagementTodoDashboard />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <CheckSquare className="h-8 w-8 text-primary" />
                To-do
              </h1>
              <p className="mt-1 text-muted-foreground">
                Your assigned cuts from project spreadsheets.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <LinkboardNavButton />
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by cut or status…"
              aria-label="Search cuts"
              className="pl-9"
            />
          </div>

          {!loading && !error && totalBeforeStatusFilter > 0 && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableHead className="h-10 text-center text-sm font-semibold text-muted-foreground">
                      Total
                    </TableHead>
                    {statusSummary.map(({ key, label }) => (
                      <TableHead
                        key={key}
                        className="h-10 text-center text-sm font-semibold text-muted-foreground"
                      >
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-3 text-center text-2xl font-bold tabular-nums">
                      {totalBeforeStatusFilter}
                    </TableCell>
                    {statusSummary.map(({ key, count }) => (
                      <TableCell key={key} className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStatusFilter(key)}
                          className={`text-2xl font-bold tabular-nums transition-colors hover:text-primary ${
                            statusFilter === key ? "text-primary underline underline-offset-4" : ""
                          }`}
                        >
                          {count}
                        </button>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
              {statusFilter && (
                <div className="border-t border-border px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                    onClick={() => setStatusFilter(null)}
                  >
                    <X className="h-3 w-3" />
                    Clear status filter
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your cuts…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-destructive">
              {error}
            </div>
          ) : totalCuts === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center text-muted-foreground shadow-soft">
              {search.trim() || statusFilter
                ? "No cuts match your filters."
                : "No cuts assigned yet. Check that your sheet name matches the Artist column exactly."}
            </div>
          ) : (
            <div className="space-y-8">
              {projectNames.map((project) => {
                const episodes = Object.keys(filtered[project]).sort();
                return (
                  <section key={project} className="space-y-4">
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      {project}
                    </h2>
                    {episodes.map((episode) => {
                      const rows = filtered[project][episode];

                      return (
                        <div
                          key={`${project}-${episode}`}
                          className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
                        >
                          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
                            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                              {episode}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {rows.length} cut{rows.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div
                            className={SCROLL_CONTAINER_CLASS}
                            style={{ maxHeight: EPISODE_SCROLL_MAX_HEIGHT }}
                          >
                            <EpisodeCutsTable
                              rows={rows}
                              episode={episode}
                              statusFilter={statusFilter}
                              onStatusClick={toggleStatusFilter}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

type EpisodeCutsTableProps = {
  rows: TodoCut[];
  episode: string;
  statusFilter: string | null;
  onStatusClick: (status: string) => void;
};

const EpisodeCutsTable = ({
  rows,
  episode,
  statusFilter,
  onStatusClick,
}: EpisodeCutsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
          Cut
        </TableHead>
        <TableHead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_hsl(var(--border))]">
          Status
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={`${episode}-${row.cut}`}>
          <TableCell className="font-medium">
            {row.url ? (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
              >
                {row.cut}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </a>
            ) : (
              row.cut
            )}
          </TableCell>
          <TableCell>
            <CutStatusBadge
              status={row.status}
              onClick={() => onStatusClick(row.status)}
              active={statusFilter === normalizeStatus(row.status)}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default Todo;
