import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ZoomIn,
  Maximize,
} from "lucide-react";
import { db } from "@/lib/firebase";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  description?: string;
  category?: string; // e.g. HAIR, MAKEUP, NAILS, SKIN
  date?: string;
  time?: string;
  createdAt?: number;
};

function toEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes("instagram.com")) {
    const clean = url.split("?")[0].replace(/\/$/, "");
    return `${clean}/embed`;
  }
  return url;
}

export function GallerySection() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [idx, setIdx] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) })));
      setLoading(false);
    });
  }, []);

  const categories = [
    "ALL",
    ...Array.from(new Set(items.map((it) => (it.category || "GENERAL").toUpperCase()))),
  ];

  const filteredItems = items.filter((it) => {
    if (activeCat === "ALL") return true;
    return (it.category || "GENERAL").toUpperCase() === activeCat;
  });

  const close = () => {
    setIdx(null);
    setZoomScale(1);
    setIsFullscreen(false);
  };

  const prev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setIdx((i) => (i === null ? null : (i - 1 + filteredItems.length) % filteredItems.length));
  };

  const next = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setIdx((i) => (i === null ? null : (i + 1) % filteredItems.length));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (idx === null) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [idx, filteredItems]);

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => (prev === 1 ? 1.6 : 1));
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  const activeItem = idx !== null ? filteredItems[idx] : null;

  return (
    <section id="gallery" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
            <ImageIcon className="h-3.5 w-3.5 text-primary" /> Gallery
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display text-foreground">
            Moments of <span className="text-gradient-rose">Transformation</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm sm:text-base">
            Browse through real photographs of our bridal makeovers, stylish haircuts, nail colors,
            and glowing skincare treatments.
          </p>
        </div>

        {/* Categories filters */}
        <div className="flex gap-2 justify-center overflow-x-auto pb-6 scrollbar-none mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCat === cat
                  ? "gradient-rose text-white shadow-soft"
                  : "bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry Column Layout */}
        {loading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {[1.2, 1.5, 0.8, 1.3, 1.1, 1.4, 0.9, 1.2].map((aspect, i) => (
              <div
                key={i}
                style={{ aspectRatio: aspect }}
                className="break-inside-avoid w-full bg-secondary/35 rounded-3xl shimmer-wave border border-border"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-card rounded-3xl border border-border">
            No transformations added under this category yet.
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredItems.map((it, localIdx) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                onClick={() => setIdx(localIdx)}
                className="break-inside-avoid relative rounded-3xl overflow-hidden bg-muted group shadow-soft hover:shadow-premium border border-border transition-all duration-300 cursor-pointer"
              >
                {it.type === "image" ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={it.url}
                      alt={it.title || it.description || ""}
                      loading="lazy"
                      className="w-full object-cover rounded-3xl group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-square gradient-rose flex flex-col items-center justify-center text-white">
                    <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
                      <Play className="h-7 w-7 text-white fill-current" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Play Video
                    </span>
                  </div>
                )}

                {/* Info overlays */}
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md p-3.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10">
                  <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">
                    {it.category || "GENERAL"}
                  </div>
                  <h4 className="text-xs text-white truncate font-semibold font-display">
                    {it.title || "Beauty Transformation"}
                  </h4>
                  {it.description && (
                    <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5 font-light">
                      {it.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[8px] text-white/50 font-mono mt-2 pt-1.5 border-t border-white/10">
                    <span>{it.date || "Just now"}</span>
                    {it.time && <span>{it.time}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Luxury Fullscreen Lightbox */}
      <AnimatePresence>
        {idx !== null && activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/95 flex items-center justify-center p-4"
            onClick={close}
          >
            {/* Control buttons */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer"
                title="Fullscreen mode"
              >
                <Maximize className="h-5 w-5" />
              </button>
              <button
                onClick={close}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer"
                aria-label="Close Preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={prev}
              className="absolute left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer z-50 hidden sm:block"
              aria-label="Previous Image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer z-50 hidden sm:block"
              aria-label="Next Image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Content Display */}
            <div
              className={`flex flex-col items-center relative z-40 transition-all duration-300 ${
                isFullscreen ? "max-w-full w-screen h-screen justify-center p-0" : "max-w-4xl w-full max-h-[80vh]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`relative rounded-2xl overflow-hidden bg-card border border-white/10 shadow-2xl flex justify-center items-center ${
                  isFullscreen ? "rounded-none border-none w-full h-full bg-black" : "max-h-[70vh] w-auto max-w-full"
                }`}
              >
                {activeItem.type === "image" ? (
                  <motion.img
                    animate={{ scale: zoomScale }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    src={activeItem.url}
                    alt=""
                    onClick={toggleZoom}
                    className={`object-contain cursor-zoom-in ${
                      isFullscreen ? "w-full h-full max-h-screen" : "max-h-[70vh] w-auto max-w-full"
                    }`}
                  />
                ) : (
                  <div className={isFullscreen ? "w-full h-full" : "w-[80vw] md:w-[60vw] aspect-video"}>
                    <iframe
                      src={toEmbed(activeItem.url)}
                      className={`w-full h-full ${isFullscreen ? "rounded-none" : "rounded-2xl"}`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              {/* Lightbox Meta bar */}
              {!isFullscreen && (
                <div className="mt-4 text-center max-w-xl space-y-1.5 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {activeItem.category || "GENERAL"}
                  </span>
                  <h4 className="text-white text-lg font-bold font-display leading-snug">
                    {activeItem.title || "Beauty Transformation"}
                  </h4>
                  {activeItem.description && (
                    <p className="text-xs text-white/80 max-w-md mx-auto font-light leading-relaxed">
                      {activeItem.description}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 text-[10px] text-white/50 font-mono pt-1">
                    <span>Uploaded: {activeItem.date || "Just now"}</span>
                    {activeItem.time && <span>at {activeItem.time}</span>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
