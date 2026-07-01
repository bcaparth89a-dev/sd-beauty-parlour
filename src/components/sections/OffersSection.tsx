import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar, Tag, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export type OfferItem = {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  image?: string;
  validUntil: string;
  createdAt?: number;
};

const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: "bridal-promo",
    title: "Luxury Bridal Suite Package",
    description:
      "Get complete wedding makeup, luxury hair design, and skin preparation styling package with top artists.",
    code: "BRIDAL20",
    discount: "20% OFF",
    validUntil: "2026-12-31",
    image:
      "https://images.unsplash.com/photo-1481501940778-c8bb63e376c5?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "facial-glow",
    title: "Hydra-Glow Facial Therapy",
    description:
      "Rejuvenate your skin with our premium mineral-infused hydra-glow session. Includes face massage.",
    code: "GLOW15",
    discount: "15% OFF",
    validUntil: "2026-08-30",
    image:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "hair-color",
    title: "Global Hair Makeover & Balayage",
    description:
      "Transform your hair styling with luxury color treatment. Free deep-conditioning mask included.",
    code: "BALAYAGE30",
    discount: "₹500 OFF",
    validUntil: "2026-09-15",
    image:
      "https://images.unsplash.com/photo-1560869713-7d0a29430f39?q=80&w=600&auto=format&fit=crop",
  },
];

export function OffersSection() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setOffers(DEFAULT_OFFERS);
        } else {
          setOffers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OfferItem, "id">) })));
        }
      },
      () => {
        setOffers(DEFAULT_OFFERS);
      },
    );
    return unsubscribe;
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const next = () => {
    setCurrentIdx((prev) => (prev + 1) % offers.length);
  };

  const prev = () => {
    setCurrentIdx((prev) => (prev - 1 + offers.length) % offers.length);
  };

  if (offers.length === 0) return null;

  return (
    <section id="offers" className="py-20 bg-secondary/15 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Special Promotions
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4">
            Exclusive <span className="text-gradient-rose">Offers & Deals</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Book now using these limited-time coupon codes and enjoy luxury pampering at special
            prices.
          </p>
        </div>

        {/* Carousel Slider */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft hover:shadow-premium transition-all duration-300">
            <AnimatePresence mode="wait">
              {offers.map((item, idx) => {
                if (idx !== currentIdx) return null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}
                    className="grid md:grid-cols-12 items-center"
                  >
                    {/* Image block */}
                    <div className="md:col-span-5 aspect-[4/3] md:aspect-auto md:h-[350px] bg-muted relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full gradient-rose-gold flex items-center justify-center">
                          <Tag className="h-16 w-16 text-white" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full text-sm shadow-md">
                        {item.discount}
                      </div>
                    </div>

                    {/* Content block */}
                    <div className="md:col-span-7 p-8 md:p-10 space-y-4">
                      <h3 className="text-2xl md:text-3xl font-bold font-display">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-3">
                        {/* Coupon copy tool */}
                        <div className="inline-flex items-center border border-dashed border-primary bg-primary/5 rounded-xl p-1.5 px-3">
                          <span className="text-xs text-muted-foreground mr-2 uppercase tracking-wide">
                            Code:
                          </span>
                          <span className="font-mono font-bold text-primary mr-3 text-sm">
                            {item.code}
                          </span>
                          <button
                            onClick={() => handleCopy(item.code)}
                            className="p-1 rounded bg-primary text-white hover:bg-primary/95 transition-colors cursor-pointer"
                          >
                            {copiedCode === item.code ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Date info */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Valid till {item.validUntil}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() =>
                            document
                              .getElementById("contact")
                              ?.scrollIntoView({ behavior: "smooth" })
                          }
                          className="px-6 py-2.5 rounded-full gradient-rose text-white text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform cursor-pointer"
                        >
                          Book with Promo
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Controls */}
          {offers.length > 1 && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={prev}
                className="p-2 rounded-full border border-border bg-card hover:bg-accent text-foreground transition-colors cursor-pointer"
                aria-label="Previous Offer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1">
                {offers.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`h-2 w-2 rounded-full cursor-pointer transition-all ${
                      i === currentIdx ? "bg-primary w-4" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="p-2 rounded-full border border-border bg-card hover:bg-accent text-foreground transition-colors cursor-pointer"
                aria-label="Next Offer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
