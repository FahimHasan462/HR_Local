import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import type { Post, PostLink } from "@/types/post";

type PostsContextValue = {
  posts: Post[];
  postsLoading: boolean;
  postsError: string | null;
  addPost: (data: { title: string; content: string }) => Promise<{ ok: boolean; message?: string }>;
  deletePost: (id: string) => Promise<{ ok: boolean; message?: string }>;
  addLink: (postId: string, label: string, url: string) => Promise<{ ok: boolean; message?: string }>;
  updatePost: (id: string, data: { title: string; content?: string }) => Promise<{ ok: boolean; message?: string }>;
  updateLink: (
    postId: string,
    linkId: string,
    label: string,
    url: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  deleteLink: (postId: string, linkId: string) => Promise<{ ok: boolean; message?: string }>;
  reorderPosts: (orderedIds: string[]) => Promise<{ ok: boolean; message?: string }>;
  refreshPosts: () => Promise<void>;
};

const PostsCtx = createContext<PostsContextValue | null>(null);

const isPersistedId = (id: string) => /^[a-f\d]{24}$/i.test(id);

const apiErrorMessage = (data: unknown, fallback: string) => {
  const err = data as { message?: string; error?: string };
  return err?.message ?? err?.error ?? fallback;
};

const normalizePost = (raw: {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  links?: Array<{ _id?: string; id?: string; label: string; url: string }>;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}): Post => ({
  id: raw._id ?? raw.id ?? "",
  title: raw.title,
  content: raw.content,
  author: String(raw.author),
  authorName: raw.authorName,
  links: (raw.links ?? []).map((link) => ({
    id: link._id ?? link.id ?? "",
    label: link.label,
    url: link.url,
  })),
  order: raw.order ?? 0,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const PostsProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const refreshPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);

    const { ok, data } = await apiFetch<Post[] | { message?: string }>("/posts");

    if (ok && Array.isArray(data)) {
      setPosts(data.map((p) => normalizePost(p)));
    } else {
      const err = data as { message?: string };
      setPostsError(err?.message ?? "Failed to load announcements.");
    }

    setPostsLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setPosts([]);
      setPostsError(null);
      setPostsLoading(false);
      return;
    }
    refreshPosts();
  }, [currentUser?.id, refreshPosts]);

  const addPost = async ({ title, content }: { title: string; content: string }) => {
    if (!currentUser) {
      return { ok: false, message: "You must be signed in." };
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Post = {
      id: tempId,
      title: title.trim(),
      content: content.trim(),
      author: currentUser.id ?? "",
      authorName: currentUser.name,
      links: [],
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [optimistic, ...prev]);
    setPostsError(null);

    const { ok, data } = await apiFetch<Post | { message?: string }>("/posts", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    });

    if (ok && data && "id" in data && isPersistedId(data.id)) {
      const created = normalizePost(data);
      setPosts((prev) => [created, ...prev.filter((p) => p.id !== tempId)]);
      return { ok: true };
    }

    setPosts((prev) => prev.filter((p) => p.id !== tempId));
    const message = apiErrorMessage(data, "Failed to publish announcement.");
    setPostsError(message);
    return { ok: false, message };
  };

  const deletePost = async (id: string) => {
    if (!isPersistedId(id)) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return { ok: true };
    }

    const previous = posts;
    setPosts((prev) => prev.filter((p) => p.id !== id));

    const { ok, data } = await apiFetch<{ message?: string }>(`/posts/${id}`, {
      method: "DELETE",
    });

    if (ok) return { ok: true };

    setPosts(previous);
    const err = data as { message?: string };
    const message = err?.message ?? "Failed to delete post.";
    setPostsError(message);
    return { ok: false, message };
  };

  const addLink = async (postId: string, label: string, url: string) => {
    if (!isPersistedId(postId)) {
      return {
        ok: false,
        message: "This post is not saved yet. Publish it first, then add links.",
      };
    }

    const previous = posts;
    const tempLinkId = `temp-link-${Date.now()}`;
    const optimisticLink: PostLink = { id: tempLinkId, label: label.trim(), url: url.trim() };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, links: [...p.links, optimisticLink] } : p,
      ),
    );

    const { ok, data } = await apiFetch<Post | { message?: string }>(`/posts/${postId}/links`, {
      method: "POST",
      body: JSON.stringify({ label, url }),
    });

    if (ok && data && "id" in data && isPersistedId(data.id)) {
      const updated = normalizePost(data);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      return { ok: true };
    }

    setPosts(previous);
    const message = apiErrorMessage(data, "Failed to add link.");
    setPostsError(message);
    return { ok: false, message };
  };

  const updatePost = async (id: string, data: { title: string; content?: string }) => {
    if (!isPersistedId(id)) {
      return { ok: false, message: "This post is not saved yet." };
    }

    const previous = posts;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              title: data.title.trim(),
              content: data.content !== undefined ? data.content.trim() : p.content,
            }
          : p,
      ),
    );

    const { ok, data: res } = await apiFetch<Post | { message?: string }>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (ok && res && "id" in res && isPersistedId(res.id)) {
      const updated = normalizePost(res);
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return { ok: true };
    }

    setPosts(previous);
    const message = apiErrorMessage(res, "Failed to update post.");
    setPostsError(message);
    return { ok: false, message };
  };

  const updateLink = async (postId: string, linkId: string, label: string, url: string) => {
    if (!isPersistedId(postId) || !isPersistedId(linkId)) {
      return { ok: false, message: "Cannot edit an unsaved link." };
    }

    const previous = posts;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              links: p.links.map((l) =>
                l.id === linkId ? { ...l, label: label.trim(), url: url.trim() } : l,
              ),
            }
          : p,
      ),
    );

    const { ok, data } = await apiFetch<Post | { message?: string }>(
      `/posts/${postId}/links/${linkId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ label, url }),
      },
    );

    if (ok && data && "id" in data && isPersistedId(data.id)) {
      const updated = normalizePost(data);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      return { ok: true };
    }

    setPosts(previous);
    const message = apiErrorMessage(data, "Failed to update link.");
    setPostsError(message);
    return { ok: false, message };
  };

  const deleteLink = async (postId: string, linkId: string) => {
    if (!isPersistedId(postId) || !isPersistedId(linkId)) {
      return { ok: false, message: "Cannot remove an unsaved link." };
    }

    const previous = posts;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, links: p.links.filter((l) => l.id !== linkId) }
          : p,
      ),
    );

    const { ok, data } = await apiFetch<Post | { message?: string }>(
      `/posts/${postId}/links/${linkId}`,
      { method: "DELETE" },
    );

    if (ok && data && "id" in data && isPersistedId(data.id)) {
      const updated = normalizePost(data);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      return { ok: true };
    }

    setPosts(previous);
    const message = apiErrorMessage(data, "Failed to delete link.");
    setPostsError(message);
    return { ok: false, message };
  };

  const reorderPosts = async (orderedIds: string[]) => {
    const previous = posts;
    const byId = new Map(posts.map((p) => [p.id, p]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is Post => !!p);
    const remaining = posts.filter((p) => !orderedIds.includes(p.id));
    setPosts([...reordered, ...remaining]);
    setPostsError(null);

    const persistedIds = orderedIds.filter(isPersistedId);
    if (persistedIds.length === 0) {
      return { ok: true };
    }

    const { ok, data } = await apiFetch<Post[] | { message?: string }>("/posts/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds: persistedIds }),
    });

    if (ok && Array.isArray(data)) {
      setPosts(data.map((p) => normalizePost(p)));
      return { ok: true };
    }

    setPosts(previous);
    const message = apiErrorMessage(data, "Failed to save post order.");
    setPostsError(message);
    return { ok: false, message };
  };

  return (
    <PostsCtx.Provider
      value={{
        posts,
        postsLoading,
        postsError,
        addPost,
        deletePost,
        addLink,
        updatePost,
        updateLink,
        deleteLink,
        reorderPosts,
        refreshPosts,
      }}
    >
      {children}
    </PostsCtx.Provider>
  );
};

export const usePosts = () => {
  const ctx = useContext(PostsCtx);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
};
