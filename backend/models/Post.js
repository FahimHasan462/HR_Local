const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "", trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    authorName: { type: String, required: true, trim: true },
    links: [linkSchema],
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
