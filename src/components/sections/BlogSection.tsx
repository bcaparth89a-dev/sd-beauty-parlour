import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, User, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  image?: string;
  author: string;
  date: string;
  readTime: string;
  createdAt?: number;
};

const DEFAULT_BLOGS: BlogPost[] = [
  {
    id: "blog-1",
    title: "5 Bridal Makeup Trends for the Perfect Wedding Day Glow",
    content:
      "From dewy glass skin finishes to minimal pastel shadows, here are the trending makeup choices for brides this season.",
    author: "Simran Sen",
    date: "Jun 15, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "blog-2",
    title: "How to Protect and Maintain Balayage Coloured Hair",
    content:
      "Colored hair requires special care. Learn the essential tips, shampoo selections, and therapy masks to keep colors vibrant.",
    author: "Vikram Malhotra",
    date: "Jun 18, 2026",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1560869713-7d0a29430f39?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "blog-3",
    title: "Daily Skincare Routine for Glowing Skin in Summer",
    content:
      "Beat the heat with our expert-recommended routine: mild hydra cleansers, active serums, and critical oil-free sunscreens.",
    author: "Priya Sharma",
    date: "Jun 20, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop",
  },
];

export function BlogSection() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "blog"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setBlogs(DEFAULT_BLOGS);
        } else {
          setBlogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) })));
        }
      },
      () => {
        setBlogs(DEFAULT_BLOGS);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <section id="blog" className="py-24 bg-secondary/10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Beauty Insights
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display">
            Beauty Tips & <span className="text-gradient-rose">Insights Blog</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Stay updated with the latest beauty tutorials, hair care guides, and skin therapy advice
            from our professional stylists.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((post, idx) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col group"
            >
              {/* Image Block */}
              <div
                onClick={() => navigate(`/blog/${post.id}`)}
                className="aspect-[16/10] bg-muted overflow-hidden relative cursor-pointer"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full gradient-rose-gold" />
                )}
              </div>

              {/* Text Block */}
              <div className="p-6 flex-1 flex flex-col justify-between text-center sm:text-left">
                <div className="space-y-3">
                  {/* Meta Details */}
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {post.date}
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 cursor-pointer text-center sm:text-left"
                  >
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed text-center sm:text-left">
                    {post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-6 text-xs font-semibold text-primary">
                  <span className="flex items-center gap-1 text-muted-foreground font-normal">
                    <Clock className="h-3.5 w-3.5" /> {post.readTime}
                  </span>
                  <button
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="flex items-center gap-1 hover:underline cursor-pointer group-hover:translate-x-1 transition-transform"
                  >
                    Know More <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
