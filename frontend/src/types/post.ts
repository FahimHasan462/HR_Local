export type PostLink = {
  id: string;
  label: string;
  url: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName: string;
  links: PostLink[];
  order?: number;
  createdAt: string;
  updatedAt?: string;
};
