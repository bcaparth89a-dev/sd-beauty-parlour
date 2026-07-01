import { useEffect, useState } from "react";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingMenu } from "@/components/FloatingMenu";
import { motion } from "framer-motion";
import { Sparkles, Shield, Eye, Heart, Compass, Star, Trophy, Users } from "lucide-react";

type AboutData = {
  aboutBanner?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  ownerImg?: string;
  ownerName?: string;
  ownerDesignation?: string;
  ownerBio?: string;
  visionImg?: string;
  visionTitle?: string;
  visionDesc?: string;
  missionImg?: string;
  missionTitle?: string;
  missionDesc?: string;
  interiorImgs?: string[];
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  experience?: string;
  image?: string;
};

const DEFAULT_ABOUT: AboutData = {
  aboutBanner: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
  aboutTitle: "Where Luxury Meets Care",
  aboutSubtitle: "Step into a sanctuary designed to bring out your finest elegance and confidence.",
  ownerImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
  ownerName: "Simran Sen",
  ownerDesignation: "Founder & Creative Director",
  ownerBio: "With over a decade of luxury bridal and hair expertise, Simran started SD Beauty Parlour with a single vision: to craft customized, high-end styling sessions that combine state-of-the-art global techniques with organic personal care.",
  visionImg: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=500&auto=format&fit=crop",
  visionTitle: "Our Vision",
  visionDesc: "To establish a benchmark for luxury aesthetics and personalized styling experiences in the region, empowering every guest through world-class artistry and uncompromising hygiene standards.",
  missionImg: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=500&auto=format&fit=crop",
  missionTitle: "Our Mission",
  missionDesc: "To deliver consistent premium styling, skincare, and bridal transformations using only luxury, certified products, curated with a deep focus on customer comfort and safety.",
  interiorImgs: [
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=500&auto=format&fit=crop",
  ],
};

export default function AboutPage() {
  const [data, setData] = useState<AboutData>(DEFAULT_ABOUT);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "About Us — SD Beauty Parlour";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Discover our heritage, founder profile, mission, vision, and team of luxury styling experts."
      );
    }
    
    // Listen for about page configuration
    const unsubAbout = onSnapshot(doc(db, "settings", "about"), (snap) => {
      if (snap.exists()) {
        setData({ ...DEFAULT_ABOUT, ...snap.data() });
      }
    });

    // Listen for team members list
    const q = query(collection(db, "team"), orderBy("order", "asc"));
    const unsubTeam = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setTeam(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) })));
      }
    });

    return () => {
      unsubAbout();
      unsubTeam();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="relative h-[45vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img
            src={data.aboutBanner}
            alt="SD Beauty Parlour Banner"
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
          />
          <div className="relative z-20 text-center px-6 max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-white"
            >
              {data.aboutTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-white/90 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed"
            >
              {data.aboutSubtitle}
            </motion.p>
          </div>
        </section>

        {/* Owner Profile Section */}
        <section className="py-20 max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5 relative">
              <div className="absolute -inset-2 bg-gradient-rose rounded-[38px] blur-lg opacity-30 pointer-events-none" />
              <div className="relative aspect-[4/5] rounded-[36px] overflow-hidden border border-border shadow-premium bg-muted">
                <img
                  src={data.ownerImg}
                  alt={data.ownerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
                <Trophy className="h-3 w-3 text-primary animate-pulse" /> The Heart Behind SD
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
                Meet <span className="text-gradient-rose">{data.ownerName}</span>
              </h2>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-primary">
                {data.ownerDesignation}
              </h4>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans font-light">
                {data.ownerBio}
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Star className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">10+ Yrs Exp</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Certified Experts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision & Mission section */}
        <section className="py-20 bg-secondary/15 border-y border-border">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12">
            {/* Vision */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-soft flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-foreground">{data.visionTitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{data.visionDesc}</p>
              </div>
              <div className="h-48 rounded-2xl overflow-hidden shadow-soft bg-muted">
                <img src={data.visionImg} alt="Vision" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Mission */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-soft flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-foreground">{data.missionTitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{data.missionDesc}</p>
              </div>
              <div className="h-48 rounded-2xl overflow-hidden shadow-soft bg-muted">
                <img src={data.missionImg} alt="Mission" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Salon Interior Images */}
        {data.interiorImgs && data.interiorImgs.length > 0 && (
          <section className="py-20 max-w-6xl mx-auto px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-primary" /> Inside The sanctuary
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-display mt-4 text-foreground">
              Our Salon <span className="text-gradient-rose">Interior Spaces</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mt-3">
              Explore our boutique environment equipped with premium relaxation amenities.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
              {data.interiorImgs.map((imgUrl, index) => (
                <div
                  key={index}
                  className="group relative aspect-video sm:aspect-square rounded-3xl overflow-hidden border border-border shadow-soft bg-muted"
                >
                  <img
                    src={imgUrl}
                    alt={`Salon Interior ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-semibold tracking-wider uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                      Premium Sanctuary Room
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Team Showcase (Optional details) */}
        {team.length > 0 && (
          <section className="py-20 bg-secondary/10 border-t border-border">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
                <Users className="h-3 w-3 text-primary" /> Meet the Artists
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-display mt-4 text-foreground">
                SD Premium <span className="text-gradient-rose">Stylists & Experts</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mt-3">
                Certified, seasoned experts dedicated to making you feel absolutely gorgeous.
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {team.map((it) => (
                  <div
                    key={it.id}
                    className="bg-card border border-border rounded-3xl p-5 shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col items-center"
                  >
                    <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-primary/20 shadow-inner mb-4 bg-muted">
                      <img
                        src={it.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground">{it.name}</h3>
                    <p className="text-xs font-medium text-primary mt-1">{it.role}</p>
                    {it.experience && (
                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full mt-3">
                        {it.experience} Exp
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <FloatingMenu />
    </div>
  );
}
