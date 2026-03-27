import type { BlogPost } from "@/lib/types";

export const blogPosts: BlogPost[] = [
  {
    slug: "cach-mua-nick-omg3q-an-toan",
    title: "Cach mua nick OMG3Q an toan de tranh scam",
    description:
      "Checklist xac minh tai khoan, thong tin lien ket va cach giao dich an toan khi mua nick OMG3Q.",
    category: "Huong dan",
  },
  {
    slug: "bang-gia-nick-omg3q-theo-vip",
    title: "Bang gia nick OMG3Q theo cap VIP va luc chien",
    description:
      "Tong hop khung gia tham khao cho cac nhom nick OMG3Q theo VIP, server va chat luong doi hinh.",
    category: "Bang gia",
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
