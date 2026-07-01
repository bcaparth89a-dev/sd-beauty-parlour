import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Award, MessageCircle, Star, Loader2 } from "lucide-react";
import heroStatic from "@/assets/hero.jpg";

type HeroData = {
  title1?: string;
  title2?: string;
  subtitle?: string;
  stat1Val?: string;
  stat1Lbl?: string;
  stat2Val?: string;
  stat2Lbl?: string;
  stat3Val?: string;
  stat3Lbl?: string;
  image?: string;
  bgImage?: string;
  heroImages?: string[];
};

const DEFAULT_HERO: HeroData = {
  title1: "Where Beauty",
  title2: "Meets Elegance",
  subtitle:
    "Welcome to SD Beauty Parlour. Indulge in bespoke bridal styling, premium hair design, and glowing skin therapies crafted with passion by certified specialists.",
  stat1Val: "10+ Years",
  stat1Lbl: "Experience",
  stat2Val: "5000+",
  stat2Lbl: "Happy Guests",
  stat3Val: "50+",
  stat3Lbl: "Luxury Services",
  image: "",
};

const KEN_BURNS_EFFECTS = [
  { scale: [1, 1.15], x: [0, -15], y: [0, -8] },  // Zoom in, pan top-left
  { scale: [1.15, 1], x: [-15, 0], y: [-8, 0] },  // Zoom out, pan bottom-right
  { scale: [1, 1.15], x: [0, 15], y: [0, 8] },    // Zoom in, pan bottom-right
  { scale: [1.15, 1], x: [15, 0], y: [8, 0] },    // Zoom out, pan top-left
  { scale: [1, 1.15], x: [0, 0], y: [0, -12] },   // Zoom in, pan up
];

export function Hero() {
  const [heroData, setHeroData] = useState<HeroData>(DEFAULT_HERO);
  const [whatsapp, setWhatsapp] = useState(import.meta.env.VITE_PARLOUR_WHATSAPP || "917990101983");
  const [index, setIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const unsubHero = onSnapshot(doc(db, "settings", "hero"), (snap) => {
      if (snap.exists()) {
        setHeroData({ ...DEFAULT_HERO, ...snap.data() });
      }
    });

    const unsubBiz = onSnapshot(doc(db, "settings", "business"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.whatsapp) setWhatsapp(data.whatsapp);
      }
    });

    return () => {
      unsubHero();
      unsubBiz();
    };
  }, []);

  const showcaseImages = heroData.heroImages && heroData.heroImages.length > 0
    ? heroData.heroImages
    : [heroData.image || heroStatic];

  // Preload images
  useEffect(() => {
    showcaseImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImagesLoaded((prev) => {
          if (prev[src]) return prev;
          return { ...prev, [src]: true };
        });
      };
    });
  }, [showcaseImages]);

  // Slideshow interval
  useEffect(() => {
    if (showcaseImages.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % showcaseImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showcaseImages]);

  const activeImage = showcaseImages[index];
  const isLoaded = !!imagesLoaded[activeImage];

  const nextIndex = (index + 1) % showcaseImages.length;
  const nextImage = showcaseImages[nextIndex];

  const waText = encodeURIComponent(
    "Hello! I'd like to book an appointment for a premium service at SD Beauty Parlour.",
  );

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex items-center overflow-hidden py-16 lg:py-24 bg-gradient-white-beige dark:bg-transparent bg-cover bg-center"
      style={{ backgroundImage: heroData.bgImage ? `url(${heroData.bgImage})` : undefined }}
    >
      {/* Background Cover Overlay for readability */}
      {heroData.bgImage && (
        <div className="absolute inset-0 bg-background/85 dark:bg-background/90 z-0 pointer-events-none" />
      )}
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-pink-400/10 dark:bg-pink-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-amber-400/10 dark:bg-amber-900/5 blur-[120px] pointer-events-none" />

      {/* Floating Beauty Particle Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary/20"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        {/* Left text description */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold tracking-wider uppercase border border-border"
          >
            <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" /> Premium Luxury Salon
            Experience
          </motion.div>

          <div className="space-y-4 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight font-display text-foreground break-words text-center lg:text-left"
            >
              {heroData.title1} <br />
              <span className="text-gradient-rose">{heroData.title2}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans text-center lg:text-left"
            >
              {heroData.subtitle}
            </motion.p>
          </div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center lg:justify-start"
          >
            <button
              onClick={() => scrollTo("contact")}
              className="px-8 py-4 rounded-full gradient-rose text-white font-semibold shadow-premium hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-2"
            >
              Book Appointment
            </button>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold shadow-soft hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" /> Book via WhatsApp
              </a>
            )}

            <button
              onClick={() => scrollTo("services")}
              className="px-7 py-4 rounded-full border border-border bg-card font-semibold hover:bg-accent text-foreground hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              Explore Services
            </button>
          </motion.div>

          {/* Highlights count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 pt-6 border-t border-border max-w-lg mx-auto lg:mx-0 w-full"
          >
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Award className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-display text-xl md:text-2xl font-bold text-foreground">
                  {heroData.stat1Val}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase font-medium">
                {heroData.stat1Lbl}
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Heart className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-display text-xl md:text-2xl font-bold text-foreground">
                  {heroData.stat2Val}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase font-medium">
                {heroData.stat2Lbl}
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-display text-xl md:text-2xl font-bold text-foreground">
                  {heroData.stat3Val}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase font-medium">
                {heroData.stat3Lbl}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Photo frame */}
        <div className="lg:col-span-5 relative mt-6 lg:mt-0 select-none">
          {/* Shimmer skeleton loader when active image is not preloaded */}
          {!isLoaded && (
            <div className="absolute inset-0 z-50 w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[36px] overflow-hidden bg-card/60 dark:bg-card/30 flex flex-col items-center justify-center shadow-premium animate-pulse">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Loading premium gallery...</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[36px] overflow-hidden shadow-premium bg-muted"
          >
            {/* Luxury Radial Light Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-400/10 blur-[80px] pointer-events-none z-0" />
            
            {/* Glass Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none z-20 mix-blend-overlay" />
            
            {/* Bottom gradient depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />

            {/* Stacking Showcases - Bottom layer shows next image ready underneath */}
            {showcaseImages.length > 1 && (
              <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
                <img
                  src={nextImage}
                  alt=""
                  className="w-full h-full object-cover scale-[1.02] filter brightness-95 opacity-80"
                />
              </div>
            )}

            {/* Active Card sliding out to reveal bottom card */}
            <AnimatePresence initial={false}>
              <motion.div
                key={index}
                initial={{ x: 0, opacity: 1, scale: 1 }}
                exit={showcaseImages.length > 1 ? {
                  x: "115%",
                  opacity: 0,
                  rotate: 6,
                  transition: { duration: 1.5, ease: [0.32, 0.94, 0.6, 1] }
                } : undefined}
                className="absolute inset-0 z-10 w-full h-full overflow-hidden origin-bottom-right"
              >
                <motion.img
                  src={activeImage}
                  alt="SD Beauty Parlour Showcase"
                  className="w-full h-full object-cover"
                  animate={KEN_BURNS_EFFECTS[index % KEN_BURNS_EFFECTS.length]}
                  transition={{
                    duration: 6.5,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Soft Floating Particles inside the frame */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-white/40"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    bottom: `${5 + Math.random() * 40}%`,
                  }}
                  animate={{
                    y: [0, -60, -120],
                    x: [0, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 4,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 0.4,
                  }}
                />
              ))}
            </div>

            {/* Quick floating detail */}
            <motion.div
              variants={floatVariants}
              animate="animate"
              className="absolute bottom-6 left-6 right-6 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl z-20 hidden sm:flex items-center gap-3 shadow-lg"
            >
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Certified Experts
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  Indulge in Premium Care
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
