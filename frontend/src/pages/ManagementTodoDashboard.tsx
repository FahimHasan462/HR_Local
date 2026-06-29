import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { LinkboardNavButton } from "@/components/LinkboardNavButton";
import { CutStatusBadge } from "@/components/CutStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { TodoArtistEpisodeSummary, TodoOverview, TodoStatusCount } from "@/types/todo";
import { useToast } from "@/hooks/use-toast";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  Users,
  WifiOff,
  X,
} from "lucide-react";

const POLL_INTERVAL_MS = 30_000;

const EPISODE_VISIBLE_ROWS = 10;
const EPISODE_ROW_HEIGHT_PX = 49;
const EPISODE_HEADER_HEIGHT_PX = 48;
const EPISODE_SCROLL_MAX_HEIGHT =
  EPISODE_HEADER_HEIGHT_PX + EPISODE_VISIBLE_ROWS * EPISODE_ROW_HEIGHT_PX;
const SCROLL_CONTAINER_CLASS =
  "overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const artistKey = (project: string, episode: string, artist: TodoArtistEpisodeSummary) =>
  `${project}::${episode}::${artist.sheetName}`;

const statusCountFor = (artist: TodoArtistEpisodeSummary, key: string) =>
  artist.statuses.find((status) => status.key === key)?.count ?? 0;

const formatRelativeTime = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const detectOverviewChanges = (
  prev: TodoOverview["projects"],
  next: TodoOverview["projects"],
): number => {
  let changed = 0;
  for (const [project, episodes] of Object.entries(next)) {
    for (const [episode, episodeData] of Object.entries(episodes)) {
      for (const artist of episodeData.artists) {
        const prevArtist = prev[project]?.[episode]?.artists.find(
          (a) => a.sheetName === artist.sheetName,
        );
        if (!prevArtist) continue;
        for (const status of artist.statuses) {
          const prevCount = prevArtist.statuses.find((s) => s.key === status.key)?.count ?? 0;
          if (prevCount !== status.count) changed++;
        }
      }
    }
  }
  return changed;
};

const ManagementTodoDashboard = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [episodeFilter, setEpisodeFilter] = useState<string | null>(null);
  const [overview, setOverview] = useState<TodoOverview["projects"]>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [relativeTime, setRelativeTime] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const overviewRef = useRef<TodoOverview["projects"]>({});

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    }

    const { ok, data } = await apiFetch<TodoOverview>("/todo/overview");

    if (ok && data?.projects) {
      const changed = isInitial ? 0 : detectOverviewChanges(overviewRef.current, data.projects);
      overviewRef.current = data.projects;
      setOverview(data.projects);
      setOffline(false);
      setLastUpdated(new Date());
      if (changed > 0) {
        toast({
          title: "Team cuts updated",
          description: `${changed} status change${changed === 1 ? "" : "s"} detected.`,
        });
      }
    } else if (isInitial) {
      setError("Could not load team cut overview. Please try again.");
      setOverview({});
    } else {
      setOffline(true);
    }

    if (isInitial) setLoading(false);
  }, [toast]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!lastUpdated) return;
    setRelativeTime(formatRelativeTime(lastUpdated));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastUpdated));
    }, 10_000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

  const allProjectNames = useMemo(() => Object.keys(overview).sort(), [overview]);

  const allEpisodeNames = useMemo(() => {
    const eps = new Set<string>();
    const source = projectFilter ? { [projectFilter]: overview[projectFilter] ?? {} } : overview;
    for (const episodes of Object.values(source)) {
      for (const ep of Object.keys(episodes)) eps.add(ep);
    }
    return [...eps].sort();
  }, [overview, projectFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result: TodoOverview["projects"] = {};

    for (const [project, episodes] of Object.entries(overview)) {
      if (projectFilter && project !== projectFilter) continue;
      for (const [episode, episodeData] of Object.entries(episodes)) {
        if (episodeFilter && episode !== episodeFilter) continue;
        const artists = query
          ? episodeData.artists.filter(
              (artist) =>
                artist.name.toLowerCase().includes(query) ||
                artist.sheetName.toLowerCase().includes(query),
            )
          : episodeData.artists;
        if (artists.length === 0) continue;
        if (!result[project]) result[project] = {};
        result[project][episode] = { ...episodeData, artists };
      }
    }
    return result;
  }, [overview, search, projectFilter, episodeFilter]);

  const projectNames = Object.keys(filtered).sort();
  const totalArtists = new Set(
    projectNames.flatMap((project) =>
      Object.values(filtered[project]).flatMap((episode) =>
        episode.artists.map((artist) => artist.sheetName),
      ),
    ),
  ).size;

  const hasFilters = !!(search.trim() || projectFilter || episodeFilter);

  const clearAllFilters = () => {
    setSearch("");
    setProjectFilter(null);
    setEpisodeFilter(null);
  };

  const toggleArtist = (key: string) => {
    setExpandedArtist((current) => (current === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <CheckSquare className="h-8 w-8 text-primary" />
                Team to-do
              </h1>
              <p className="mt-1 text-muted-foreground">
                Overview of artist cuts across all projects and episodes.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">Updated {relativeTime}</span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleManualRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="default" className="gap-2" asChild>
                <Link to="/">
                  <LayoutDashboard className="h-4 w-4" />
                  Team dashboard
                </Link>
              </Button>
              <LinkboardNavButton />
            </div>
          </div>

          {/* Offline banner */}
          {offline && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              Connection lost — showing last known data. Retrying…
            </div>
          )}

          {/* Search + Dropdowns */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by artist name…"
                aria-label="Search artists"
                className="pl-9"
              />
            </div>

            {!loading && allProjectNames.length > 0 && (
              <Select
                value={projectFilter ?? "all"}
                onValueChange={(v) => {
                  setProjectFilter(v === "all" ? null : v);
                  setEpisodeFilter(null);
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {allProjectNames.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!loading && allEpisodeNames.length > 1 && (
              <Select
                value={episodeFilter ?? "all"}
                onValueChange={(v) => setEpisodeFilter(v === "all" ? null : v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All episodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All episodes</SelectItem>
                  {allEpisodeNames.map((ep) => (
                    <SelectItem key={ep} value={ep}>{ep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={clearAllFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {!loading && !error && totalArtists > 0 && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{totalArtists} artists with assigned cuts</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading team overview…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-destructive">
              {error}
              <Button variant="outline" size="sm" onClick={() => load(true)}>
                Try again
              </Button>
            </div>
          ) : projectNames.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center text-muted-foreground shadow-soft">
              {hasFilters
                ? "No results match your filters."
                : "No artist cuts found across configured sheets."}
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
                      const episodeData = filtered[project][episode];
                      const { statuses, artists } = episodeData;

                      return (
                        <div
                          key={`${project}-${episode}`}
                          className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
                        >
                          <div className="border-b border-border bg-muted/30 px-4 py-2.5">
                            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                              {episode}
                            </h3>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-48">Artist</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                {statuses.map((status) => (
                                  <TableHead key={status.key} className="text-center">
                                    {status.label}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {artists.map((artist) => {
                                const key = artistKey(project, episode, artist);
                                const isExpanded = expandedArtist === key;
                                return (
                                  <ArtistOverviewRows
                                    key={key}
                                    artist={artist}
                                    statuses={statuses}
                                    isExpanded={isExpanded}
                                    onToggle={() => toggleArtist(key)}
                                  />
                                );
                              })}
                            </TableBody>
                          </Table>
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

type ArtistOverviewRowsProps = {
  artist: TodoArtistEpisodeSummary;
  statuses: Pick<TodoStatusCount, "key" | "label">[];
  isExpanded: boolean;
  onToggle: () => void;
};

const ArtistOverviewRows = ({
  artist,
  statuses,
  isExpanded,
  onToggle,
}: ArtistOverviewRowsProps) => (
  <>
    <TableRow className="cursor-pointer hover:bg-muted/40" onClick={onToggle}>
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {artist.name}
          {artist.name !== artist.sheetName && (
            <span className="text-xs font-normal text-muted-foreground">({artist.sheetName})</span>
          )}
        </span>
      </TableCell>
      <TableCell className="text-center text-lg font-bold tabular-nums">{artist.total}</TableCell>
      {statuses.map((status) => (
        <TableCell key={status.key} className="text-center text-lg font-bold tabular-nums">
          {statusCountFor(artist, status.key)}
        </TableCell>
      ))}
    </TableRow>
    {isExpanded && (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={statuses.length + 2} className="bg-muted/20 p-0">
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Assigned cuts
            </p>
            <div
              className={SCROLL_CONTAINER_CLASS}
              style={{
                maxHeight:
                  artist.cuts.length > EPISODE_VISIBLE_ROWS ? EPISODE_SCROLL_MAX_HEIGHT : undefined,
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Cut</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artist.cuts.map((cut) => (
                    <TableRow key={cut.cut}>
                      <TableCell className="font-medium">
                        {cut.url ? (
                          <a
                            href={cut.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {cut.cut}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          </a>
                        ) : (
                          cut.cut
                        )}
                      </TableCell>
                      <TableCell>
                        <CutStatusBadge status={cut.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TableCell>
      </TableRow>
    )}
  </>
);

export default ManagementTodoDashboard;
