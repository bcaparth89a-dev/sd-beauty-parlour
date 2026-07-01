import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Heart, Award, BadgeCheck } from "lucide-react";

export type FeatureItem = {
  id: string;
  icon: string; // Award | Sparkles | ShieldCheck | Heart
  title: string;
  desc: string;
  order?: number;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Award: Award,
  Sparkles: Sparkles,
  ShieldCheck: ShieldCheck,
  Heart: Heart,
};

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: "feat-1",
    icon: "Award",
    title: "Certified Stylists",
    desc: "Our team consists of highly experienced, international-certified makeup artists and hair stylists.",
  },
  {
    id: "feat-2",
    icon: "Sparkles",
    title: "Premium Products",
    desc: "We use only top-tier, luxury beauty products (MAC, Kryolan, L'Oréal, Olaplex) to ensure the best results.",
  },
  {
    id: "feat-3",
    icon: "ShieldCheck",
    title: "Hygienic & Safe",
    desc: "Strict sanitization protocols for all equipment and single-use kits for client safety and comfort.",
  },
  {
    id: "feat-4",
    icon: "Heart",
    title: "Customized Care",
    desc: "Every service is adapted to your unique skin type, hair texture, and style preferences.",
  },
];

export function WhyChooseUs() {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [sectionImg, setSectionImg] = useState(
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=800"
  );

  useEffect(() => {
    // Listen for Why Choose Us feature items list
    const q = query(collection(db, "whychooseus"), orderBy("order", "asc"));
    const unsubscribeWhy = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFeatures(DEFAULT_FEATURES);
        } else {
          setFeatures(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeatureItem, "id">) })),
          );
        }
      },
      () => {
        setFeatures(DEFAULT_FEATURES);
      },
    );

    // Listen for home images configuration
    const unsubscribeImg = onSnapshot(
      doc(db, "settings", "home_images"),
      (snap) => {
        if (snap.exists() && snap.data().whyChooseUsImg) {
          setSectionImg(snap.data().whyChooseUsImg);
        }
      }
    );

    return () => {
      unsubscribeWhy();
      unsubscribeImg();
    };
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section id="why-choose-us" className="py-24 bg-gradient-white-beige dark:bg-transparent relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-pink-300/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-300/10 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-primary" /> The SD Promise
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display">
            Why Choose <span className="text-gradient-rose">SD Beauty Parlour</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-sm sm:text-base">
            We blend expertise, high-end products, and a relaxing luxury atmosphere to create an
            unforgettable beauty experience.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Section Image Block */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute -inset-1 bg-gradient-rose rounded-[38px] blur opacity-25 pointer-events-none" />
            <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[36px] overflow-hidden shadow-premium bg-muted">
              <img
                src={sectionImg}
                alt="SD Beauty Salon Atmosphere"
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
              />
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-7 grid sm:grid-cols-2 gap-5"
          >
            {features.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || Sparkles;
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="bg-card border border-border rounded-3xl p-5 shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left group"
                >
                  <div className="h-11 w-11 rounded-xl bg-secondary group-hover:bg-primary/10 transition-colors flex items-center justify-center text-primary mb-4 shrink-0">
                    <IconComponent className="h-5.5 w-5.5 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
