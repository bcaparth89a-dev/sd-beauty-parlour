import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sparkles, Calendar } from "lucide-react";

export function CTASection() {
  const [bgUrl, setBgUrl] = useState("https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200");

  useEffect(() => {
    return onSnapshot(doc(db, "settings", "home_images"), (snap) => {
      if (snap.exists() && snap.data().ctaBannerImg) {
        setBgUrl(snap.data().ctaBannerImg);
      }
    });
  }, []);

  return (
    <section
      className="py-24 bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-0 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-6 animate-in fade-in duration-500">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse" /> Limited Slots Available
        </span>
        <h2 className="text-4xl md:text-5xl font-bold font-display text-white leading-tight max-w-2xl mx-auto">
          Ready to Experience True Luxury Pampering?
        </h2>
        <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
          Book your personalized appointment today. Let our certified artists design your signature look.
        </p>
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 rounded-full bg-white text-black hover:bg-primary hover:text-white transition-all font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-premium hover:scale-105"
          >
            <Calendar className="h-4.5 w-4.5" /> Book Your Session Now
          </button>
        </div>
      </div>
    </section>
  );
}
