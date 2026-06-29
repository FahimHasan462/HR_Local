import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import type { TodoArtistEpisodeSummary, TodoOverview, TodoStatusCount } from "@/types/todo";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  Search,
  Users,
} from "lucide-react";

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

const ManagementTodoDashboard = () => {
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<TodoOverview["projects"]>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const { ok, data } = await apiFetch<TodoOverview>("/todo/overview");
      if (cancelled) return;

      if (!ok) {
        setError("Could not load team cut overview. Please try again.");
        setOverview({});
      } else {
        setOverview(data?.projects ?? {});
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return overview;

    const result: TodoOverview["projects"] = {};
    for (const [project, episodes] of Object.entries(overview)) {
      for (const [episode, episodeData] of Object.entries(episodes)) {
        const artists = episodeData.artists.filter(
          (artist) =>
            artist.name.toLowerCase().includes(query) ||
            artist.sheetName.toLowerCase().includes(query),
        );
        if (artists.length === 0) continue;
        if (!result[project]) result[project] = {};
        result[project][episode] = { ...episodeData, artists };
      }
    }
    return result;
  }, [overview, search]);

  const projectNames = Object.keys(filtered).sort();
  const totalArtists = new Set(
    projectNames.flatMap((project) =>
      Object.values(filtered[project]).flatMap((episode) =>
        episode.artists.map((artist) => artist.sheetName),
      ),
    ),
  ).size;

  const toggleArtist = (key: string) => {
    setExpandedArtist((current) => (current === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mx-auto max-w-6xl">
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
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="default" className="gap-2" asChild>
                <Link to="/">
                  <LayoutDashboard className="h-4 w-4" />
                  Team dashboard
                </Link>
              </Button>
              <LinkboardNavButton />
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by artist name…"
              aria-label="Search artists"
              className="pl-9"
            />
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
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-destructive">
              {error}
            </div>
          ) : projectNames.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center text-muted-foreground shadow-soft">
              {search.trim()
                ? "No artists match your search."
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
                  artist.cuts.length > EPISODE_VISIBLE_ROWS
                    ? EPISODE_SCROLL_MAX_HEIGHT
                    : undefined,
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
                            onClick={(event) => event.stopPropagation()}
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
