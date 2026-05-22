const router = require("express").Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/auth");
const managementOnly = require("../middleware/managementOnly");

function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

function formatPost(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    title: o.title,
    content: o.content,
    author: String(o.author),
    authorName: o.authorName,
    links: (o.links ?? []).map((link) => ({
      id: String(link._id),
      label: link.label,
      url: link.url,
    })),
    order: o.order ?? 0,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function listPostsSorted() {
  let posts = await Post.find().sort({ order: 1, createdAt: -1 });

  if (posts.some((p) => p.order == null)) {
    posts = await Post.find().sort({ createdAt: -1 });
    await Promise.all(
      posts.map((p, index) => Post.updateOne({ _id: p._id }, { $set: { order: index } })),
    );
    posts.forEach((p, index) => {
      p.order = index;
    });
    posts.sort((a, b) => a.order - b.order);
  }

  return posts;
}

router.use(authMiddleware);

router.get("/", async (_req, res) => {
  try {
    const posts = await listPostsSorted();
    res.json(posts.map(formatPost));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/", managementOnly, async (req, res) => {
  const { title, content } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  try {
    const author = await Employee.findById(req.auth.sub);
    if (!author) {
      return res.status(401).json({ message: "Author not found." });
    }

    const last = await Post.findOne().sort({ order: -1 }).select("order");
    const order = (last?.order ?? -1) + 1;

    const post = await Post.create({
      title: title.trim(),
      content: (content ?? "").trim(),
      author: author._id,
      authorName: author.name,
      links: [],
      order,
    });

    res.status(201).json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/reorder", async (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: "orderedIds array is required." });
  }

  for (const id of orderedIds) {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post id in order list." });
    }
  }

  try {
    await Promise.all(
      orderedIds.map((id, index) => Post.updateOne({ _id: id }, { $set: { order: index } })),
    );

    const posts = await listPostsSorted();
    res.json(posts.map(formatPost));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.patch("/:id", managementOnly, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid post id." });
  }

  const { title, content } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.title = title.trim();
    if (content !== undefined) {
      post.content = String(content).trim();
    }
    await post.save({ validateModifiedOnly: true });

    res.json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", managementOnly, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid post id." });
  }

  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.json({ message: "Post deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/:id/links", managementOnly, async (req, res) => {
  const { label, url } = req.body;

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid post id." });
  }

  if (!label?.trim() || !url?.trim()) {
    return res.status(400).json({ message: "Label and URL are required." });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (!Array.isArray(post.links)) {
      post.links = [];
    }
    post.links.push({ label: label.trim(), url: url.trim() });
    post.markModified("links");
    await post.save({ validateModifiedOnly: true });

    res.status(201).json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.patch("/:postId/links/:linkId", managementOnly, async (req, res) => {
  const { label, url } = req.body;

  if (!isValidObjectId(req.params.postId)) {
    return res.status(400).json({ message: "Invalid post id." });
  }
  if (!isValidObjectId(req.params.linkId)) {
    return res.status(400).json({ message: "Invalid link id." });
  }
  if (!label?.trim() || !url?.trim()) {
    return res.status(400).json({ message: "Label and URL are required." });
  }

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const link = post.links.id(req.params.linkId);
    if (!link) {
      return res.status(404).json({ message: "Link not found." });
    }

    link.label = label.trim();
    link.url = url.trim();
    post.markModified("links");
    await post.save({ validateModifiedOnly: true });

    res.json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:postId/links/:linkId", managementOnly, async (req, res) => {
  if (!isValidObjectId(req.params.postId)) {
    return res.status(400).json({ message: "Invalid post id." });
  }
  if (!isValidObjectId(req.params.linkId)) {
    return res.status(400).json({ message: "Invalid link id." });
  }

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const link = post.links.id(req.params.linkId);
    if (!link) {
      return res.status(404).json({ message: "Link not found." });
    }

    link.deleteOne();
    post.markModified("links");
    await post.save({ validateModifiedOnly: true });

    res.json(formatPost(post));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
