import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { usePosts } from "@/context/PostsContext";
import { useSignOut } from "@/hooks/useSignOut";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Post, PostLink } from "@/types/post";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

const COMPANY_NAME = "Skibidy Entertainment";
const COMPANY_SUBTITLE = "Information Hub";
const CALENDAR_EMBED_URL = import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL ?? "";

/** Same row style as HR complaints / leaves cards on the HR dashboard */
const ENTRY_ROW_CLASS =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-bounce hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft";

const formatPostDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const isPersistedId = (id: string) => /^[a-f\d]{24}$/i.test(id);

/** Keep drag on the card from starting when interacting with buttons, links, or inputs */
const preventDragBubble = (e: React.DragEvent) => e.stopPropagation();

const Linkboard = () => {
  const { currentUser } = useApp();
  const signOut = useSignOut();
  const {
    posts,
    postsLoading,
    postsError,
    addPost,
    updatePost,
    deletePost,
    addLink,
    updateLink,
    deleteLink,
    reorderPosts,
  } = usePosts();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [viewPost, setViewPost] = useState<Post | null>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostError, setEditPostError] = useState<string | null>(null);
  const [editPostSubmitting, setEditPostSubmitting] = useState(false);

  const [addLinkPostId, setAddLinkPostId] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const [editingLinkKey, setEditingLinkKey] = useState<string | null>(null);
  const [editLinkLabel, setEditLinkLabel] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [editLinkError, setEditLinkError] = useState<string | null>(null);
  const [editLinkSubmitting, setEditLinkSubmitting] = useState(false);

  const [dragPostId, setDragPostId] = useState<string | null>(null);
  const [dragOverPostId, setDragOverPostId] = useState<string | null>(null);
  const [reorderSaving, setReorderSaving] = useState(false);

  const isManagement = currentUser?.role === "management";
  const canDragPosts = isManagement;

  if (!currentUser) return <Navigate to="/" replace />;

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostError(null);
    setAddLinkPostId(null);
    setEditingLinkKey(null);
  };

  const startEditLink = (postId: string, link: PostLink) => {
    setEditingLinkKey(`${postId}:${link.id}`);
    setEditLinkLabel(link.label);
    setEditLinkUrl(link.url);
    setEditLinkError(null);
    setAddLinkPostId(null);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSubmitting(true);

    const result = await addPost({ title, content: "" });
    setCreateSubmitting(false);

    if (result.ok) {
      setTitle("");
      setShowCreateForm(false);
    } else {
      setCreateError(result.message ?? "Failed to publish announcement.");
    }
  };

  const handleSavePost = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    setEditPostError(null);
    setEditPostSubmitting(true);

    const result = await updatePost(postId, { title: editPostTitle, content: "" });
    setEditPostSubmitting(false);

    if (result.ok) {
      setEditingPostId(null);
    } else {
      setEditPostError(result.message ?? "Failed to update post.");
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!window.confirm(`Delete announcement "${post.title}"?`)) return;
    await deletePost(post.id);
    if (viewPost?.id === post.id) setViewPost(null);
  };

  const handleAddLink = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSubmitting(true);

    const result = await addLink(postId, linkLabel, linkUrl);
    setLinkSubmitting(false);

    if (result.ok) {
      setLinkLabel("");
      setLinkUrl("");
      setAddLinkPostId(null);
    } else {
      setLinkError(result.message ?? "Failed to add link.");
    }
  };

  const handleSaveLink = async (e: React.FormEvent, postId: string, linkId: string) => {
    e.preventDefault();
    setEditLinkError(null);
    setEditLinkSubmitting(true);

    const result = await updateLink(postId, linkId, editLinkLabel, editLinkUrl);
    setEditLinkSubmitting(false);

    if (result.ok) {
      setEditingLinkKey(null);
    } else {
      setEditLinkError(result.message ?? "Failed to update link.");
    }
  };

  const handleDeleteLink = async (postId: string, linkId: string) => {
    if (!window.confirm("Remove this link?")) return;
    await deleteLink(postId, linkId);
  };

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    if (!canDragPosts || !isPersistedId(postId)) return;
    setDragPostId(postId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-post-id", postId);
  };

  const handleDragEnd = () => {
    setDragPostId(null);
    setDragOverPostId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (!canDragPosts || !dragPostId || dragPostId === targetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPostId(targetId);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("application/x-post-id") || dragPostId;
    setDragPostId(null);
    setDragOverPostId(null);

    if (!sourceId || sourceId === targetId || !canDragPosts) return;

    const ids = posts.map((p) => p.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);

    setReorderSaving(true);
    await reorderPosts(next);
    setReorderSaving(false);
  };

  const initial = currentUser.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{COMPANY_NAME}</h1>
              <p className="text-xs text-muted-foreground leading-tight">{COMPANY_SUBTITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
              aria-hidden
            >
              {initial}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.title}</p>
            </div>
            <RoleBadge role={currentUser.role} />
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
            <Link to="/">
              <ChevronLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-3xl font-bold">
                <Megaphone className="h-8 w-8 text-primary" />
                Announcements
              </h2>
              <p className="mt-1 text-muted-foreground">
                {isManagement
                  ? "Post and manage company announcements"
                  : "Stay up to date with the latest from your team"}
              </p>
              {canDragPosts && posts.length > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Drag a post card to reorder the layout.
                </p>
              )}
            </div>

            {isManagement && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={showCreateForm ? "secondary" : "default"}
                  className="gap-2"
                  onClick={() => {
                    setShowCreateForm((v) => !v);
                    setCreateError(null);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
                <Button
                  type="button"
                  variant={showCalendar ? "secondary" : "outline"}
                  className="gap-2"
                  onClick={() => setShowCalendar((v) => !v)}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
              </div>
            )}
          </div>
        </div>

        {postsError && (
          <div
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {postsError}
          </div>
        )}

        {isManagement && showCreateForm && (
          <form
            onSubmit={handlePublish}
            className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                required
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive" role="alert">
                {createError}
              </p>
            )}
            <Button type="submit" disabled={createSubmitting} className="gap-2">
              {createSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Announcement
            </Button>
          </form>
        )}

        {isManagement && showCalendar && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {CALENDAR_EMBED_URL ? (
              <iframe
                title="Company calendar"
                src={CALENDAR_EMBED_URL}
                className="h-[min(600px,70vh)] w-full border-0"
                allowFullScreen
              />
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Set <code className="rounded bg-muted px-1">VITE_GOOGLE_CALENDAR_EMBED_URL</code> in{" "}
                <code className="rounded bg-muted px-1">frontend/.env</code> to embed Google Calendar.
              </p>
            )}
          </div>
        )}

        {postsLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading announcements…
          </div>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            No announcements yet.
          </p>
        ) : (
          <>
          {reorderSaving && (
            <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving layout…
            </p>
          )}
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const canDrag = canDragPosts && isPersistedId(post.id);
              return (
              <li
                key={post.id}
                draggable={canDrag}
                onDragStart={(e) => canDrag && handleDragStart(e, post.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => canDrag && handleDragOver(e, post.id)}
                onDrop={(e) => canDrag && handleDrop(e, post.id)}
                onDragLeave={() => {
                  if (dragOverPostId === post.id) setDragOverPostId(null);
                }}
                className={cn(
                  "flex flex-col rounded-2xl border border-border bg-card/50 p-3 shadow-soft transition-shadow",
                  canDrag && "cursor-grab active:cursor-grabbing",
                  dragOverPostId === post.id && canDrag && "border-primary ring-2 ring-primary/30",
                  dragPostId === post.id && "opacity-60",
                )}
              >
                {editingPostId === post.id && isManagement ? (
                  <form
                    onSubmit={(e) => handleSavePost(e, post.id)}
                    onDragStart={preventDragBubble}
                    className="mb-2 space-y-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`edit-title-${post.id}`}>Title</Label>
                      <Input
                        id={`edit-title-${post.id}`}
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        required
                      />
                    </div>
                    {editPostError && (
                      <p className="text-sm text-destructive">{editPostError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={editPostSubmitting}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPostId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => setViewPost(post)}
                      onDragStart={preventDragBubble}
                      className={ENTRY_ROW_CLASS}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{post.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {post.authorName}
                          {" · "}
                          {formatPostDate(post.createdAt)}
                          {" · "}
                          <span className="font-medium text-foreground">
                            {post.links.length} link{post.links.length === 1 ? "" : "s"}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>

                    {isManagement && (
                      <div className="flex flex-wrap gap-2 px-1">
                        {isPersistedId(post.id) && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onDragStart={preventDragBubble}
                              onClick={() => startEditPost(post)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onDragStart={preventDragBubble}
                              onClick={() => {
                                setAddLinkPostId(addLinkPostId === post.id ? null : post.id);
                                setLinkLabel("");
                                setLinkUrl("");
                                setLinkError(null);
                                setEditingLinkKey(null);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Link
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onDragStart={preventDragBubble}
                          onClick={() => handleDeletePost(post)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {post.links.length > 0 && (
                  <ul className="space-y-2">
                    {post.links.map((link) => {
                      const linkKey = `${post.id}:${link.id}`;
                      const isEditingLink = editingLinkKey === linkKey;

                      if (isEditingLink && isManagement) {
                        return (
                          <li key={link.id}>
                            <form
                              onSubmit={(e) => handleSaveLink(e, post.id, link.id)}
                              onDragStart={preventDragBubble}
                              className="space-y-2 rounded-xl border border-border bg-card p-3"
                            >
                              <div className="space-y-2">
                                <Label htmlFor={`edit-label-${link.id}`}>Label</Label>
                                <Input
                                  id={`edit-label-${link.id}`}
                                  value={editLinkLabel}
                                  onChange={(e) => setEditLinkLabel(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-url-${link.id}`}>URL</Label>
                                <Input
                                  id={`edit-url-${link.id}`}
                                  value={editLinkUrl}
                                  onChange={(e) => setEditLinkUrl(e.target.value)}
                                  required
                                />
                              </div>
                              {editLinkError && (
                                <p className="text-sm text-destructive">{editLinkError}</p>
                              )}
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={editLinkSubmitting}>
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLinkKey(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </li>
                        );
                      }

                      return (
                        <li key={link.id} className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onDragStart={preventDragBubble}
                            className={`${ENTRY_ROW_CLASS} min-w-0 flex-1`}
                          >
                            <p className="min-w-0 flex-1 truncate font-semibold">{link.label}</p>
                            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </a>
                          {isManagement && isPersistedId(link.id) && (
                            <div className="flex shrink-0 flex-col gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Edit ${link.label}`}
                                onDragStart={preventDragBubble}
                                onClick={() => startEditLink(post.id, link)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                aria-label={`Remove ${link.label}`}
                                onDragStart={preventDragBubble}
                                onClick={() => handleDeleteLink(post.id, link.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {isManagement && addLinkPostId === post.id && (
                  <form
                    onSubmit={(e) => handleAddLink(e, post.id)}
                    onDragStart={preventDragBubble}
                    className="mt-2 space-y-2 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`link-label-${post.id}`}>Label</Label>
                      <Input
                        id={`link-label-${post.id}`}
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        placeholder="e.g. Handbook"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`link-url-${post.id}`}>URL</Label>
                      <Input
                        id={`link-url-${post.id}`}
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://…"
                        required
                      />
                    </div>
                    {linkError && <p className="text-sm text-destructive">{linkError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={linkSubmitting}>
                        {linkSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddLinkPostId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            );
            })}
          </ul>
          </>
        )}
      </main>

      <Dialog open={!!viewPost} onOpenChange={(o) => !o && setViewPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {viewPost?.title}
            </DialogTitle>
            <DialogDescription>
              {viewPost && (
                <>
                  {viewPost.authorName} · {formatPostDate(viewPost.createdAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewPost && (
            <div className="space-y-4 text-sm">
              {viewPost.content.trim() && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Details</p>
                  <p className="mt-1 whitespace-pre-wrap">{viewPost.content}</p>
                </div>
              )}
              {viewPost.links.length > 0 ? (
                <ul className="space-y-2">
                  {viewPost.links.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={ENTRY_ROW_CLASS}
                      >
                        <p className="min-w-0 flex-1 truncate font-semibold">{link.label}</p>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No links in this post yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Linkboard;
