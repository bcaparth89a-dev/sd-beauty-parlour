import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Sparkles, Eye } from "lucide-react";

type BeforeAfterData = {
  beforeImg?: string;
  afterImg?: string;
};

const DEFAULT_BEFORE_AFTER: BeforeAfterData = {
  beforeImg:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  afterImg:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
};

export function BeforeAfter() {
  const [data, setData] = useState<BeforeAfterData>(DEFAULT_BEFORE_AFTER);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "beforeafter"), (snap) => {
      if (snap.exists()) {
        setData({ ...DEFAULT_BEFORE_AFTER, ...snap.data() });
      }
    });
    return unsub;
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <section id="before-after" className="py-24 bg-gradient-white-beige dark:bg-transparent relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <Eye className="h-3.5 w-3.5 text-primary" /> Visual Results
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display">
            Real <span className="text-gradient-rose">Transformations</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Drag the gold slider bar left and right to compare the natural, stunning changes
            achieved by our expert artists.
          </p>
        </div>

        {/* Slider Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="relative aspect-video w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-premium border border-border select-none cursor-ew-resize"
        >
          {/* Before Image (Background) */}
          <img
            src={data.beforeImg}
            alt="Before Treatment"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full z-20">
            Before
          </div>

          {/* After Image (Foreground Clip) */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            }}
          >
            <img
              src={data.afterImg}
              alt="After Treatment"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
            />
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              After
            </div>
          </div>

          {/* Golden Handle Bar */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-gradient-gold-champagne z-30 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-gold-champagne shadow-lg flex items-center justify-center border-2 border-white pointer-events-none">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
