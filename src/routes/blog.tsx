import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, User, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

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
      "From dewy glass skin finishes to minimal pastel shadows, here are the trending makeup choices for brides this season. Expect to see skin-like bases that highlight natural beauty rather than mask it, with soft touches of blush and champagne highlighters creating a luminous, lit-from-within glow.\n\nTraditional heavy contouring is taking a back seat. Modern brides are opting for softer draping techniques that emphasize soft angles. Pastel eyes in shades of lavender, soft peach, and mint green are replacing the classic dark smokey eye, giving a fresh, romantic appeal. Finish the look with a high-shine glossy lip or a soft, smudged berry stain for a contemporary bridal look that photographs beautifully and looks stunning in person.",
    author: "Simran Sen",
    date: "Jun 15, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "blog-2",
    title: "How to Protect and Maintain Balayage Coloured Hair",
    content:
      "Colored hair requires special care. Learn the essential tips, shampoo selections, and therapy masks to keep colors vibrant.\n\nFirst, always wait at least 72 hours before washing your hair after a color treatment. This allows the cuticle layers to fully close and lock in the color molecules. Second, invest in a high-quality sulfate-free, color-safe shampoo and conditioner. Sulfates strip moisture and color, leading to premature fading.\n\nThird, wash your hair with lukewarm or cool water instead of hot water, as hot water opens the hair cuticles, allowing dye to escape. Finally, use weekly deep-conditioning masks formulated for dyed hair, and try to limit heat styling to prevent dry, porous strands from losing their luster.",
    author: "Vikram Malhotra",
    date: "Jun 18, 2026",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1560869713-7d0a29430f39?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "blog-3",
    title: "Daily Skincare Routine for Glowing Skin in Summer",
    content:
      "Beat the heat with our expert-recommended routine: mild hydra cleansers, active serums, and critical oil-free sunscreens.\n\nSummer introduces higher heat and humidity, stimulating sebum production and increasing sweat. To prevent clogged pores and dull skin, switch to a gentle gel-based hydra cleanser that cleanses without stripping skin lipids. Follow up with a hydrating toner containing hyaluronic acid or rosewater.\n\nDuring the day, apply a lightweight vitamin C serum to defend against UV-induced free radicals, and never skip sunscreen! Choose a broad-spectrum SPF 50 that is gel-based or oil-free. At night, use a niacinamide serum to calm inflammation and lock in lightweight moisture with a water-cream moisturizer.",
    author: "Priya Sharma",
    date: "Jun 20, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function BlogPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top on load or ID change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. Check local default list
    const defaultPost = DEFAULT_BLOGS.find((b) => b.id === id);
    if (defaultPost) {
      setPost(defaultPost);
      setLoading(false);
    } else {
      // 2. Fetch from Firestore
      const unsub = onSnapshot(
        doc(db, "blog", id),
        (snap) => {
          if (snap.exists()) {
            setPost({ id: snap.id, ...snap.data() } as BlogPost);
          } else {
            setPost(null);
          }
          setLoading(false);
        },
        () => {
          setPost(null);
          setLoading(false);
        }
      );
      return unsub;
    }
  }, [id]);

  // Fetch recent posts
  useEffect(() => {
    const q = query(collection(db, "blog"), orderBy("createdAt", "desc"), limit(4));
    const unsub = onSnapshot(
      q,
      (snap) => {
        let dbBlogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
        if (dbBlogs.length === 0) {
          dbBlogs = DEFAULT_BLOGS;
        }
        // Filter out current active post
        setRecentPosts(dbBlogs.filter((p) => p.id !== id).slice(0, 3));
      },
      () => {
        setRecentPosts(DEFAULT_BLOGS.filter((p) => p.id !== id).slice(0, 3));
      }
    );
    return unsub;
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-background">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center gap-6">
          <BookOpen className="h-16 w-16 text-muted-foreground animate-pulse" />
          <h1 className="text-3xl font-display font-bold text-foreground">Blog Post Not Found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The beauty article you are looking for does not exist or has been removed from our editorial columns.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-rose text-white font-bold rounded-full text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Back Navigation breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/#blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate max-w-[200px] font-medium">{post.title}</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Content Area (Col 8) */}
            <article className="lg:col-span-8 space-y-8">
              {/* Post Meta Header */}
              <div className="space-y-4">
                <span className="inline-block bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Editorial Insights
                </span>
                <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground leading-[1.15]">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground border-b border-border/85 pb-6">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="h-4 w-4 text-primary" /> By {post.author}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-primary" /> Published {post.date}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium ml-auto">
                    <Clock className="h-4 w-4 text-muted-foreground" /> {post.readTime}
                  </span>
                </div>
              </div>

              {/* Cover Image */}
              <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden bg-muted shadow-soft relative border border-border/40">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary/10 to-rose-gold/25 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-primary/30" />
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="font-sans text-sm md:text-base leading-relaxed text-foreground/80 space-y-6 pt-4">
                {post.content.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx} className="leading-8 tracking-wide">
                    {para}
                  </p>
                ))}
              </div>

              {/* Back CTA Button */}
              <div className="pt-8 border-t border-border/60">
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 border border-border hover:bg-secondary text-foreground text-xs uppercase tracking-wider font-bold rounded-full transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Insights Blog
                </button>
              </div>
            </article>

            {/* Right Sidebar Area (Col 4) */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Profile Card */}
              <div className="bg-secondary/15 border border-border rounded-3xl p-6 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-gradient-rose mx-auto flex items-center justify-center text-white font-display text-lg font-bold">
                  SD
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-sm text-foreground">SD Beauty Experts</h3>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">Hair & Skin Specialists</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  Our professional beauty experts publish styling tutorials, color maintenance guides, and skincare recommendations weekly.
                </p>
              </div>

              {/* Recent Articles list */}
              {recentPosts.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Recent Articles
                  </h3>

                  <div className="space-y-4 divide-y divide-border/60">
                    {recentPosts.map((it) => (
                      <div key={it.id} className="pt-4 first:pt-0 flex gap-3.5 items-start group">
                        {it.image && (
                          <div
                            onClick={() => navigate(`/blog/${it.id}`)}
                            className="h-14 w-20 rounded-xl overflow-hidden bg-muted shrink-0 cursor-pointer border border-border/30"
                          >
                            <img src={it.image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1 flex-1">
                          <h4
                            onClick={() => navigate(`/blog/${it.id}`)}
                            className="font-display font-bold text-xs text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-2 leading-tight"
                          >
                            {it.title}
                          </h4>
                          <span className="text-[9px] text-muted-foreground block">{it.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointment Booking Promotion Card */}
              <div className="bg-gradient-to-br from-primary to-rose-gold border border-primary/20 rounded-3xl p-6 text-white shadow-soft relative overflow-hidden">
                <div className="relative z-10 space-y-4 text-left">
                  <h3 className="font-display font-bold text-lg leading-tight">Ready for a Premium Glow Up?</h3>
                  <p className="text-xs text-white/85 leading-relaxed">
                    Book an appointment with our elite beauty experts for bridal makeup, hair designs, or specialized skin care.
                  </p>
                  <button
                    onClick={() => {
                      navigate("/");
                      setTimeout(() => {
                        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                      }, 200);
                    }}
                    className="w-full py-3 bg-white text-primary font-bold text-xs uppercase tracking-wider rounded-full hover:bg-white/90 transition-colors cursor-pointer text-center"
                  >
                    Book Appointment Now
                  </button>
                </div>
                <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
