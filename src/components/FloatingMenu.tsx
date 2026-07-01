import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, Instagram, Calendar, ChevronUp, X } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, x: 25, scale: 0.85 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.85,
    transition: { duration: 0.15 },
  },
};

export function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [contacts, setContacts] = useState({
    phone: import.meta.env.VITE_PARLOUR_PHONE || "",
    whatsapp: import.meta.env.VITE_PARLOUR_WHATSAPP || "",
    instagram: import.meta.env.VITE_PARLOUR_INSTAGRAM || "",
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "business"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setContacts({
          phone: data.phone || import.meta.env.VITE_PARLOUR_PHONE || "",
          whatsapp: data.whatsapp || import.meta.env.VITE_PARLOUR_WHATSAPP || "",
          instagram: data.instagram || import.meta.env.VITE_PARLOUR_INSTAGRAM || "",
        });
      }
    });
    return unsub;
  }, []);

  const handleBookClick = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  const textMessage = encodeURIComponent(
    "Hello SD Beauty Parlour! I'd like to make an inquiry about your premium services.",
  );

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            {/* Expanded Menu Actions */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col gap-3 items-end mb-2"
                >
                  {/* WhatsApp */}
                  {contacts.whatsapp && (
                    <motion.a
                      variants={itemVariants}
                      href={`https://wa.me/${contacts.whatsapp}?text=${textMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 justify-end group pointer-events-auto cursor-pointer"
                      title="Chat with us"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-premium select-none transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:-translate-x-1">
                        WhatsApp Chat
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-premium hover:scale-105 transition-transform duration-300">
                        <MessageCircle className="h-5.5 w-5.5" />
                      </div>
                    </motion.a>
                  )}

                  {/* Phone Call */}
                  {contacts.phone && (
                    <motion.a
                      variants={itemVariants}
                      href={`tel:${contacts.phone}`}
                      className="flex items-center gap-3 justify-end group pointer-events-auto cursor-pointer"
                      title="Call now"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-premium select-none transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:-translate-x-1">
                        Call Now
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#007AFF] text-white shadow-premium hover:scale-105 transition-transform duration-300">
                        <Phone className="h-5 w-5" />
                      </div>
                    </motion.a>
                  )}

                  {/* Instagram */}
                  {contacts.instagram && (
                    <motion.a
                      variants={itemVariants}
                      href={contacts.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 justify-end group pointer-events-auto cursor-pointer"
                      title="Follow on Instagram"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-premium select-none transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:-translate-x-1">
                        Instagram
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-premium hover:scale-105 transition-transform duration-300">
                        <Instagram className="h-5 w-5" />
                      </div>
                    </motion.a>
                  )}

                  {/* Booking */}
                  <motion.button
                    variants={itemVariants}
                    onClick={handleBookClick}
                    className="flex items-center gap-3 justify-end group pointer-events-auto cursor-pointer"
                    title="Book Appointment"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-premium select-none transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:-translate-x-1">
                      Book Now
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-rose text-white shadow-premium hover:scale-105 transition-transform duration-300">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trigger Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="h-14 w-14 rounded-full gradient-gold-champagne text-white font-semibold shadow-premium cursor-pointer flex items-center justify-center border border-white/20 relative pointer-events-auto"
              aria-label="Quick action menu"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              animate={isOpen ? { rotate: 180 } : { scale: [1, 1.05, 1] }}
              transition={
                isOpen
                  ? { duration: 0.3 }
                  : {
                      scale: {
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                      },
                    }
              }
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? "open" : "closed"}
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                >
                  {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                  ) : (
                    <ChevronUp className="h-6 w-6 text-white" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
