import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sparkles, ArrowRight } from "lucide-react";

export function FeaturedBeauty() {
  const [imgUrl, setImgUrl] = useState("https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800");

  useEffect(() => {
    return onSnapshot(doc(db, "settings", "home_images"), (snap) => {
      if (snap.exists() && snap.data().featuredBeautyImg) {
        setImgUrl(snap.data().featuredBeautyImg);
      }
    });
  }, []);

  return (
    <section id="featured-beauty" className="py-24 bg-background relative overflow-hidden border-t border-border">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> Signature Style
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground leading-tight">
            Indulge in Our <br />
            <span className="text-gradient-rose">Signature Beauty Artistry</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light font-sans">
            Every face is a blank canvas, and we are here to craft your masterpiece. Discover styling tailored entirely to your skin tone, facial contours, and the statement you want to make.
          </p>
          <div className="pt-2">
            <button
              onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 rounded-full border border-border text-foreground hover:bg-accent text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              View Makeup Packages <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="md:col-span-5 relative">
          <div className="absolute -inset-2 bg-gradient-rose rounded-[38px] blur-md opacity-20 pointer-events-none" />
          <div className="relative aspect-[4/5] rounded-[36px] overflow-hidden shadow-premium bg-muted">
            <img src={imgUrl} alt="Signature Makeup Look" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
