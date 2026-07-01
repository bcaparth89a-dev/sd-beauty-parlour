import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

interface SplashProps {
  onDone: () => void;
  quote?: string;
}

export function Splash({ onDone, quote = "Enhancing Beauty, Elevating Confidence" }: SplashProps) {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShow(false);
      const doneTimer = setTimeout(() => {
        onDone();
      }, 800);
      return () => clearTimeout(doneTimer);
    }, 3800);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background"
        >
          {/* Ambient Background Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fff8fa_0%,#ffeef2_40%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_center,#2a0f13_0%,#18080a_45%,#120708_100%)]" />

          {/* Luxury Animated Orbs */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-[500px] h-[500px] rounded-full bg-pink-400/10 dark:bg-pink-900/10 blur-[120px]"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 left-20 w-32 h-32 bg-amber-300/10 dark:bg-amber-500/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              x: [0, -10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-20 right-20 w-40 h-40 bg-rose-300/15 dark:bg-rose-500/5 rounded-full blur-3xl"
          />

          {/* Floating Particle Dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {mounted && [...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-pink-300/30 dark:bg-white/10"
                style={{
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: Math.random() * 3 + 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Logo Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 scale-125 rounded-full bg-gradient-to-r from-pink-400/20 via-rose-300/20 to-amber-200/20 blur-3xl animate-pulse" />
            <img
              src={logo}
              alt="SD Beauty Parlour"
              className="relative h-36 w-36 md:h-48 md:w-48 object-contain drop-shadow-[0_0_35px_rgba(244,154,168,0.5)]"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-6 text-4xl md:text-6xl font-bold tracking-wide text-center"
          >
            <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 dark:from-pink-300 dark:via-rose-200 dark:to-amber-200 bg-clip-text text-transparent">
              SD Beauty Parlour
            </span>
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-4 h-[2px] bg-gradient-to-r from-transparent via-pink-400/60 dark:via-pink-300/60 to-transparent"
          />

          {/* Subtitle / Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-5 text-base md:text-xl italic text-rose-700 dark:text-rose-200/80 max-w-lg text-center px-6 font-display"
          >
            ✨ {quote} ✨
          </motion.p>

          {/* Progress Indicator */}
          <div className="absolute bottom-16 flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <motion.span
                key={idx}
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: idx * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <div className="absolute bottom-6 flex flex-col items-center gap-1.5 z-20">
            <span className="text-[8px] tracking-[0.2em] uppercase text-rose-400/40 dark:text-white/20 font-medium">
              Premium Luxury Experience
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/developer");
              }}
              className="group text-[10px] tracking-[0.15em] font-semibold text-rose-500/60 hover:text-primary dark:text-white/40 dark:hover:text-primary transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none pb-0.5 uppercase"
            >
              Made By <span className="underline underline-offset-4 decoration-rose-400/30 group-hover:decoration-primary/80 transition-colors">Parth Pawar</span> (Pronix Digital)
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
