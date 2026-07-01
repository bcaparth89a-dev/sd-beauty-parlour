import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Instagram, Facebook, Phone, MessageCircle, Mail, MapPin, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

type SettingsData = {
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
};

export function Footer() {
  const [contacts, setContacts] = useState<SettingsData>({
    phone: import.meta.env.VITE_PARLOUR_PHONE || "",
    whatsapp: import.meta.env.VITE_PARLOUR_WHATSAPP || "",
    email: import.meta.env.VITE_PARLOUR_EMAIL || "",
    instagram: import.meta.env.VITE_PARLOUR_INSTAGRAM || "",
    facebook: import.meta.env.VITE_PARLOUR_FACEBOOK || "",
    address: import.meta.env.VITE_PARLOUR_ADDRESS || "",
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "business"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setContacts({
          phone: data.phone || import.meta.env.VITE_PARLOUR_PHONE || "",
          whatsapp: data.whatsapp || import.meta.env.VITE_PARLOUR_WHATSAPP || "",
          email: data.email || import.meta.env.VITE_PARLOUR_EMAIL || "",
          instagram: data.instagram || import.meta.env.VITE_PARLOUR_INSTAGRAM || "",
          facebook: data.facebook || import.meta.env.VITE_PARLOUR_FACEBOOK || "",
          address: data.address || import.meta.env.VITE_PARLOUR_ADDRESS || "",
        });
      }
    });
    return unsub;
  }, []);

  const handleAnchorClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.location.href = `/#${id}`;
  };

  return (
    <footer className="bg-card border-t border-border mt-24 relative overflow-hidden">
      {/* Dynamic decorative backdrop blur element */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-border pb-12">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="SD Logo" className="h-10 w-10 object-contain" />
              <span className="font-display text-lg font-bold text-gradient-rose">SD Beauty Parlour</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We specialize in custom bridal styling, premium hair design, and state-of-the-art organic skin therapies tailored for your ultimate confidence.
            </p>
            {contacts.address && (
              <p className="text-xs text-muted-foreground flex items-start gap-2 pt-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{contacts.address}</span>
              </p>
            )}
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleAnchorClick("home")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-primary transition-colors block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleAnchorClick("services")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Catalog Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleAnchorClick("gallery")}
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Ambience & Portfolio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Beauty Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-foreground">Treatments</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Hair Styling & Coloring</li>
              <li>Organic Facials & Skincare</li>
              <li>Bridal Makeovers & Styling</li>
              <li>Nail Spa & Pedicure</li>
              <li>Threading & Waxing</li>
            </ul>
          </div>

          {/* Column 4: Contact & Socials */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-foreground">Quick Support</h4>
            <ul className="space-y-3.5 text-xs">
              {contacts.phone && (
                <li>
                  <a
                    href={`tel:${contacts.phone}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{contacts.phone}</span>
                  </a>
                </li>
              )}
              {contacts.email && (
                <li>
                  <a
                    href={`mailto:${contacts.email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors break-all"
                  >
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span>{contacts.email}</span>
                  </a>
                </li>
              )}
              {contacts.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${contacts.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                </li>
              )}
            </ul>

            {/* Social channels */}
            <div className="flex gap-2.5 pt-2">
              {contacts.instagram && (
                <a
                  href={contacts.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {contacts.facebook && (
                <a
                  href={contacts.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
                  aria-label="Like our page on Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom copyright details */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 text-[10px] text-muted-foreground gap-4">
          <div>
            © {new Date().getFullYear()} SD Beauty Parlour. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Made By</span>
            <Link to="/developer" className="text-primary font-bold hover:underline transition-colors">
              Parth Pawar (Pronix Digital)
            </Link>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms & Conditions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
