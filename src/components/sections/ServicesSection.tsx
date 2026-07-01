import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Scissors, Clock, ArrowUpDown, X, Calendar, Star } from "lucide-react";
import { db } from "@/lib/firebase";

export type ServiceItem = {
  id: string;
  category: string; // e.g. HAIR, SKIN, MAKEUP, NAILS
  group: string; // e.g. Hair Colour, Facials
  name: string;
  price: string;
  note?: string;
  duration?: string; // e.g. 45 mins
  badge?: string; // e.g. Popular, Best Seller
  image?: string;
  gallery?: string[];
  order?: number;
};

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  HAIR: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop",
  SKIN: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop",
  MAKEUP:
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop",
  NAILS:
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400&auto=format&fit=crop",
  SPA: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400&auto=format&fit=crop",
};

export function ServicesSection() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "default">("default");
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [modalActiveImage, setModalActiveImage] = useState<string>("");

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceItem, "id">) })));
      setLoading(false);
    });
  }, []);

  // Get distinct categories
  const categories = ["ALL", ...Array.from(new Set(items.map((it) => it.category.toUpperCase())))];

  // Helper to parse price as number
  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Filter items
  const filteredItems = items.filter((it) => {
    const matchesCat = activeCat === "ALL" || it.category.toUpperCase() === activeCat;
    const matchesSearch =
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (it.note && it.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
    if (sortBy === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
    return 0; // default order
  });

  const handleSelectService = (it: ServiceItem) => {
    const serviceString = `${it.category} / ${it.group} / ${it.name} (${it.price})`;
    sessionStorage.setItem("selected-service", serviceString);
    window.dispatchEvent(new Event("service-selected"));
    setSelectedService(null);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const openServiceModal = (it: ServiceItem) => {
    setSelectedService(it);
    setModalActiveImage(it.image || CATEGORY_PLACEHOLDERS[it.category.toUpperCase()] || CATEGORY_PLACEHOLDERS.HAIR);
  };

  return (
    <section id="services" className="py-24 bg-secondary/20 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
            <Scissors className="h-3.5 w-3.5 text-primary" /> Our Catalog
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display text-foreground">
            Bespoke <span className="text-gradient-rose">Beauty Services</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-sm sm:text-base">
            Indulge in our range of luxury treatments, facial therapy, wedding makeup, and styles,
            all priced transparently.
          </p>
        </div>

        {/* Filter and search control bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-card border border-border p-4 rounded-3xl shadow-soft">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
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

          {/* Search and Sort controls */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-secondary/50 border border-input focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "price-asc" | "price-desc" | "default")
                }
                className="pl-3 pr-8 py-2.5 rounded-full bg-secondary/50 border border-input focus:outline-none focus:border-primary text-xs font-medium cursor-pointer appearance-none"
              >
                <option value="default">Default Sort</option>
                <option value="name">Name (A-Z)</option>
                <option value="price-asc">Price (Low → High)</option>
                <option value="price-desc">Price (High → Low)</option>
              </select>
              <ArrowUpDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Services List Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft h-[380px] flex flex-col justify-between"
              >
                {/* Header Image Shimmer */}
                <div className="aspect-[16/9] w-full bg-secondary/80 shimmer-wave" />

                {/* Content Shimmer */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="h-3 w-1/4 rounded bg-secondary shimmer-wave" />
                    <div className="h-5 w-3/4 rounded bg-secondary shimmer-wave" />
                    <div className="space-y-1.5 pt-1">
                      <div className="h-3.5 w-full rounded bg-secondary shimmer-wave" />
                      <div className="h-3.5 w-5/6 rounded bg-secondary shimmer-wave" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <div className="h-6 w-1/4 rounded bg-secondary shimmer-wave" />
                    <div className="h-8 w-1/3 rounded-full bg-secondary shimmer-wave" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-card rounded-3xl border border-border">
            No services found matching your criteria.
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedItems.map((it) => {
                const img =
                  it.image ||
                  CATEGORY_PLACEHOLDERS[it.category.toUpperCase()] ||
                  CATEGORY_PLACEHOLDERS.HAIR;
                return (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6 }}
                    onClick={() => openServiceModal(it)}
                    className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    {/* Header Image Frame */}
                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                      <img
                        src={img}
                        alt={it.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      {/* Badge indicator */}
                      {(it.badge || (it.order && it.order % 3 === 0)) && (
                        <div className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-md">
                          {it.badge || "Popular"}
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{it.duration || "30 mins"}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-center sm:text-left items-center sm:items-start">
                      <div className="space-y-2 w-full">
                        <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest text-center sm:text-left">
                          {it.category} • {it.group}
                        </div>
                        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors text-center sm:text-left">
                          {it.name}
                        </h3>
                        {it.note && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic text-center sm:text-left">
                            {it.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border mt-4 w-full">
                        <div className="text-xl font-bold font-mono text-gradient-rose">
                          {it.price}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectService(it);
                          }}
                          className="px-5 py-2 rounded-full bg-secondary hover:bg-primary hover:text-white text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1 border border-border hover:border-primary"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Dynamic Service Details Lightbox Dialog */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card border border-border rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 relative shadow-premium"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid md:grid-cols-12 gap-6 items-stretch">
                {/* Images view */}
                <div className="md:col-span-6 space-y-3">
                  <div className="aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-muted border">
                    <img src={modalActiveImage} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Thumbnails row (cover + gallery) */}
                  {selectedService.gallery && selectedService.gallery.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {/* Cover Thumbnail */}
                      <button
                        onClick={() =>
                          setModalActiveImage(
                            selectedService.image ||
                              CATEGORY_PLACEHOLDERS[selectedService.category.toUpperCase()] ||
                              CATEGORY_PLACEHOLDERS.HAIR,
                          )
                        }
                        className={`h-12 w-16 border-2 rounded-lg overflow-hidden shrink-0 transition-all ${
                          modalActiveImage ===
                          (selectedService.image ||
                            CATEGORY_PLACEHOLDERS[selectedService.category.toUpperCase()] ||
                            CATEGORY_PLACEHOLDERS.HAIR)
                            ? "border-primary scale-102"
                            : "border-transparent opacity-80"
                        }`}
                      >
                        <img
                          src={
                            selectedService.image ||
                            CATEGORY_PLACEHOLDERS[selectedService.category.toUpperCase()] ||
                            CATEGORY_PLACEHOLDERS.HAIR
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Gallery Thumbnails */}
                      {selectedService.gallery.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setModalActiveImage(url)}
                          className={`h-12 w-16 border-2 rounded-lg overflow-hidden shrink-0 transition-all ${
                            modalActiveImage === url
                              ? "border-primary scale-102"
                              : "border-transparent opacity-80"
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details view */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5 uppercase tracking-wide">
                        {selectedService.category}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                        {selectedService.group}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-2xl text-foreground">
                      {selectedService.name}
                    </h3>

                    {selectedService.note && (
                      <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/30 p-3 rounded-xl border border-border">
                        {selectedService.note}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Duration: <span className="font-semibold text-foreground">{selectedService.duration || "30 mins"}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4.5 w-4.5 text-amber-500 shrink-0 fill-current" />
                        <span className="text-xs text-muted-foreground">
                          Artistry: <span className="font-semibold text-foreground">Certified Experts</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
                    <div className="text-2xl font-bold font-mono text-gradient-rose">
                      {selectedService.price}
                    </div>
                    <button
                      onClick={() => handleSelectService(selectedService)}
                      className="px-6 py-3 rounded-full gradient-rose text-white font-semibold text-xs flex items-center gap-2 shadow-premium hover:scale-102 cursor-pointer transition-transform"
                    >
                      <Calendar className="h-4 w-4" /> Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
