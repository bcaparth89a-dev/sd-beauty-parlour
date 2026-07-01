import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Menu,
  X,
  Maximize,
  Minimize,
  Home,
  Info,
  Award,
  Users,
  Sparkles,
  Scissors,
  Eye,
  Image as ImageIcon,
  Tag,
  BookOpen,
  HelpCircle,
  Clock,
  Calendar,
  ChevronDown,
  Phone,
  MessageSquare,
  Instagram,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

type NavLink = {
  id: string;
  label: string;
  isAnchor?: boolean;
  to?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

type NavGroup = {
  label: string;
  items: NavLink[];
};

const navGroups: NavGroup[] = [
  {
    label: "Discover",
    items: [
      {
        id: "why-choose-us",
        label: "Why Choose Us",
        isAnchor: true,
        icon: Award,
        description: "Our promises, quality standards, and hygiene safety",
      },
      {
        id: "about",
        label: "About SD",
        to: "/about",
        icon: Info,
        description: "Explore our story, heritage, and luxury vision",
      },
      {
        id: "team",
        label: "Our Expert Team",
        isAnchor: true,
        icon: Users,
        description: "Meet our certified stylists and therapists",
      },
    ],
  },
  {
    label: "Experience",
    items: [
      {
        id: "featured-beauty",
        label: "Signature Artistry",
        isAnchor: true,
        icon: Sparkles,
        description: "Custom cosmetic styling and facial contour design",
      },
      {
        id: "services",
        label: "Services Menu",
        isAnchor: true,
        icon: Scissors,
        description: "Pampering hair styling, skincare and bridal packages",
      },
      {
        id: "before-after",
        label: "Transformations",
        isAnchor: true,
        icon: Eye,
        description: "Visual results from our premium styling sessions",
      },
      {
        id: "gallery",
        label: "Photo Gallery",
        isAnchor: true,
        icon: ImageIcon,
        description: "A glimpse of our luxury salon sanctuary",
      },
    ],
  },
  {
    label: "Updates & Info",
    items: [
      {
        id: "offers",
        label: "Offers & Promos",
        isAnchor: true,
        icon: Tag,
        description: "Limited-time deals and bridal coupons",
      },
      {
        id: "blog",
        label: "Beauty Blog",
        isAnchor: true,
        icon: BookOpen,
        description: "Styling tips, hair maintenance and skin guides",
      },
      {
        id: "faq",
        label: "FAQs",
        isAnchor: true,
        icon: HelpCircle,
        description: "Got questions? Find answers on our sessions",
      },
      {
        id: "maps-and-hours",
        label: "Location & Hours",
        isAnchor: true,
        icon: Clock,
        description: "Directions, map locator, and operation timings",
      },
    ],
  },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [parlourName, setParlourName] = useState("SD Beauty Parlour");
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contactData, setContactData] = useState<any>(null);
  const [drawerOffer, setDrawerOffer] = useState<any>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "business"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.name) setParlourName(data.name);
      }
    });
    return unsub;
  }, []);

  // Fetch Contact settings dynamically
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contact"), (snap) => {
      if (snap.exists()) {
        setContactData(snap.data());
      }
    });
    return unsub;
  }, []);

  // Fetch latest active promo coupon for the drawer bottom
  useEffect(() => {
    const q = query(collection(db, "offers"), orderBy("createdAt", "desc"), limit(1));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setDrawerOffer({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setDrawerOffer({
            title: "Luxury Bridal Suite Package",
            description: "Get complete wedding makeup, luxury hair design, and skin styling.",
            code: "BRIDAL20",
            discount: "20% OFF",
          });
        }
      },
      () => {
        setDrawerOffer({
          title: "Luxury Bridal Suite Package",
          description: "Get complete wedding makeup, luxury hair design, and skin styling.",
          code: "BRIDAL20",
          discount: "20% OFF",
        });
      }
    );
    return unsub;
  }, []);

  // Section Observer for Active Section Highlighting
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.15, rootMargin: "-15% 0px -40% 0px" }
    );

    const targetIds = [
      "home",
      "why-choose-us",
      "featured-beauty",
      "services",
      "offers",
      "team",
      "before-after",
      "gallery",
      "blog",
      "faq",
      "maps-and-hours",
      "contact",
    ];

    targetIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleLinkClick = (id: string, isAnchor?: boolean, to?: string) => {
    setOpen(false);
    setActiveDropdown(null);

    if (to) {
      navigate(to);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
      // Small timeout to allow index page to load before scrolling
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isLinkActive = (item: NavLink) => {
    if (item.to) return location.pathname === item.to;
    return activeSection === item.id && location.pathname === "/";
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isLinkActive(item));
  };

  const toggleMobileGroup = (label: string) => {
    setMobileExpandedGroup(mobileExpandedGroup === label ? null : label);
  };

  const drawerVariants = {
    hidden: { opacity: 0, x: "100%", scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      x: "100%",
      scale: 0.98,
      transition: { ease: "easeInOut", duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <nav
      className={`sticky top-0 transition-all duration-300 ${
        open ? "z-[9999]" : "z-50"
      } ${
        scrolled
          ? "backdrop-blur-md bg-background/80 border-b border-border/80 shadow-soft"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <button
          onClick={() => handleLinkClick("home", true)}
          className="flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          <img src={logo} alt="SD Logo" className="h-12 w-12 object-contain" />
          <span className="font-display text-xl font-bold text-gradient-rose hidden sm:inline leading-none">
            {parlourName}
          </span>
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Home standalone link */}
          <button
            onClick={() => handleLinkClick("home", true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
              activeSection === "home" && location.pathname === "/"
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            Home
            {activeSection === "home" && location.pathname === "/" && (
              <motion.span
                layoutId="navbar-underline"
                className="absolute bottom-1 left-4 right-4 h-[1.5px] bg-primary rounded-full"
              />
            )}
          </button>

          {/* Group dropdowns */}
          {navGroups.map((group) => {
            const active = isGroupActive(group);
            return (
              <div
                key={group.label}
                className="relative py-2"
                onMouseEnter={() => setActiveDropdown(group.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer focus:outline-none ${
                    active ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      activeDropdown === group.label ? "rotate-180" : ""
                    }`}
                  />
                  {active && (
                    <motion.span
                      layoutId="navbar-underline"
                      className="absolute bottom-1 left-4 right-8 h-[1.5px] bg-primary rounded-full"
                    />
                  )}
                </button>

                <AnimatePresence>
                  {activeDropdown === group.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 rounded-2xl bg-card border border-border p-2 shadow-premium backdrop-blur-md z-50"
                    >
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const itemActive = isLinkActive(item);
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleLinkClick(item.id, item.isAnchor, item.to)}
                              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left cursor-pointer group/item ${
                                itemActive
                                  ? "bg-primary/5 text-primary"
                                  : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg transition-colors duration-200 ${
                                  itemActive
                                    ? "bg-primary/10 text-primary"
                                    : "bg-secondary text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary"
                                }`}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <div className="text-[12px] font-bold">{item.label}</div>
                                <div className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug font-normal">
                                  {item.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Fullscreen & Theme togglers */}
          <button
            onClick={toggleFullscreen}
            className="ml-2 p-2.5 rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Toggle fullscreen"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <button
            onClick={toggle}
            className="ml-1 p-2.5 rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Book Now Main CTA */}
          <button
            onClick={() => handleLinkClick("contact", true)}
            className="ml-3 px-6 py-2.5 rounded-full bg-gradient-rose text-white text-xs font-bold hover:scale-[1.03] transition-transform duration-200 shadow-soft cursor-pointer"
          >
            Book Appointment
          </button>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex items-center gap-1.5">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl hover:bg-secondary/40 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Toggle fullscreen"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-secondary/40 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className={`p-2.5 rounded-xl hover:bg-secondary/40 cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-200 ${
              open ? "z-[9999]" : "z-50"
            }`}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-xl z-[9997] lg:hidden"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 w-full h-[100vh] lg:hidden z-[9998] p-6 flex flex-col justify-between overflow-y-auto shadow-premium"
              style={{
                background: "linear-gradient(to bottom, #120607, #1A0A0C, #2A1013)",
              }}
            >
              {/* Header */}
              <div className="pt-10 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-9 w-9 object-contain" />
                  <div className="text-left">
                    <span className="font-display font-bold text-base text-white block">
                      {parlourName}
                    </span>
                    <span className="text-[9px] text-white/50 tracking-widest uppercase font-semibold block mt-0.5">
                      Luxury Experience
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 py-6 space-y-3 overflow-y-auto">
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleLinkClick("home", true)}
                    className="w-full text-left px-5 py-3.5 rounded-2xl flex items-center gap-3.5 bg-white/5 border border-white/5 text-white/80 animate-in fade-in duration-300"
                  >
                    <Home className="h-4.5 w-4.5 text-white/60" />
                    <span className="font-sans font-bold text-sm">Home</span>
                  </button>
                </motion.div>

                {navGroups.map((group) => {
                  const isExpanded = mobileExpandedGroup === group.label;
                  return (
                    <motion.div key={group.label} variants={itemVariants} className="space-y-1">
                      <button
                        onClick={() => toggleMobileGroup(group.label)}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                          isExpanded
                            ? "bg-white/10 border-white/10 text-white shadow-soft"
                            : "bg-white/5 border-white/5 text-white/80 hover:text-white"
                        }`}
                      >
                        <span className="font-sans font-bold text-sm">{group.label}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-white/50 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-black/20 rounded-2xl border border-white/5"
                          >
                            <div className="p-1.5 space-y-0.5">
                              {group.items.map((item) => {
                                const active = isLinkActive(item);
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleLinkClick(item.id, item.isAnchor, item.to)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold ${
                                      active
                                        ? "bg-gradient-to-r from-primary to-rose-gold text-white"
                                        : "text-white/70 hover:text-white hover:bg-white/5"
                                    }`}
                                  >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Drawer bottom actions */}
              <div className="border-t border-white/10 pt-5 mt-auto space-y-4 shrink-0">
                {/* Contact quick actions */}
                <div className="flex justify-around items-center py-1 text-white/70">
                  <a
                    href={`tel:${contactData?.phone1 || "+917990101983"}`}
                    className="flex flex-col items-center gap-1 hover:text-white transition-colors"
                  >
                    <Phone className="h-4.5 w-4.5 text-rose-gold" />
                    <span className="text-[10px] font-semibold">Call Salon</span>
                  </a>
                  <a
                    href={contactData?.whatsapp || "https://wa.me/917990101983"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1 hover:text-white transition-colors"
                  >
                    <MessageSquare className="h-4.5 w-4.5 text-green-400" />
                    <span className="text-[10px] font-semibold">WhatsApp</span>
                  </a>
                  <a
                    href={contactData?.instagram || "https://instagram.com/sdbeautyparlour"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1 hover:text-white transition-colors"
                  >
                    <Instagram className="h-4.5 w-4.5 text-rose-400" />
                    <span className="text-[10px] font-semibold">Instagram</span>
                  </a>
                </div>

                {/* Primary CTA Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full py-3 bg-gradient-rose hover:scale-[1.01] transition-transform text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-soft flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Appointment</span>
                  </button>

                  <a
                    href={contactData?.whatsapp || "https://wa.me/917990101983"}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp Booking</span>
                  </a>

                  <a
                    href={`tel:${contactData?.phone1 || "+917990101983"}`}
                    className="w-full py-3 border border-white/20 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Now</span>
                  </a>
                </div>

                {/* Promotion card */}
                {drawerOffer && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden flex items-center gap-3">
                    <div className="flex-1 text-left">
                      <span className="inline-block bg-primary px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider mb-1">
                        {drawerOffer.discount || "SPECIAL DEAL"}
                      </span>
                      <h4 className="font-display font-bold text-xs text-white truncate">
                        {drawerOffer.title}
                      </h4>
                      <p className="text-[9px] text-white/50 line-clamp-1 mt-0.5 leading-normal">
                        {drawerOffer.description}
                      </p>
                      {drawerOffer.code && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/5 text-[9px] font-mono text-rose-gold">
                          <span>CODE:</span>
                          <span className="font-bold text-white select-all">{drawerOffer.code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer copyright */}
                <div className="text-center text-[9px] text-white/30 tracking-widest uppercase">
                  &copy; {new Date().getFullYear()} {parlourName}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
