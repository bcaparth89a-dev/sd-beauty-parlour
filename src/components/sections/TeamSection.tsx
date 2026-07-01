import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { Award, Instagram, Sparkles, Star } from "lucide-react";
import { db } from "@/lib/firebase";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  order?: number;
};

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: "stylist-1",
    name: "Simran Sen",
    role: "Lead Makeup Artist & Bridal Expert",
    bio: "With over 8 years of celebrity and bridal makeup experience, Simran specializes in airbrush and HD bridal glow.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "stylist-2",
    name: "Vikram Malhotra",
    role: "Senior Hair Designer & Balayage Specialist",
    bio: "Vikram is a master of haircuts, premium coloring, balayage, and hair therapy. He has trained internationally.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "stylist-3",
    name: "Priya Sharma",
    role: "Aesthetic Skin & Therapy Expert",
    bio: "Priya offers science-backed luxury facial therapies and dermatological solutions to reveal natural glow skin.",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
  },
];

export function TeamSection() {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    const q = query(collection(db, "team"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setTeam(DEFAULT_TEAM);
        } else {
          setTeam(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) })));
        }
      },
      () => {
        setTeam(DEFAULT_TEAM);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <section id="team" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 right-0 w-72 h-72 rounded-full bg-pink-400/5 blur-[120px]" />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full bg-amber-400/5 blur-[120px]" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <Award className="h-3.5 w-3.5 text-primary" /> Meet Our Experts
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display">
            Artisans of <span className="text-gradient-rose">Elegance</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Our certified designers and therapists are dedicated to bringing out your best look and
            making you feel pampered.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft hover:shadow-premium transition-all duration-300 group"
            >
              {/* Profile Image container */}
              <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full gradient-rose-gold flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-white" />
                  </div>
                )}
                {/* Highlight/rating */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-amber-400 p-1.5 px-3 rounded-full flex items-center gap-1 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>5.0</span>
                </div>
              </div>

              {/* Info Block */}
              <div className="p-6 space-y-3 text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="w-full">
                  <h3 className="font-display font-bold text-xl text-foreground text-center sm:text-left">{member.name}</h3>
                  <div className="text-sm font-semibold text-primary/80 mt-0.5 text-center sm:text-left">{member.role}</div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic text-center sm:text-left">{member.bio}</p>
                <div className="flex gap-2 pt-2 border-t border-border mt-4 justify-center sm:justify-start w-full">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
