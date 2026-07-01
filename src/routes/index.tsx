import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Splash } from "@/components/Splash";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { FeaturedBeauty } from "@/components/sections/FeaturedBeauty";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { OffersSection } from "@/components/sections/OffersSection";
import { TeamSection } from "@/components/sections/TeamSection";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { GallerySection } from "@/components/sections/GallerySection";
import { CTASection } from "@/components/sections/CTASection";
import { BlogSection } from "@/components/sections/BlogSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { MapsAndHours } from "@/components/sections/MapsAndHours";
import { ContactSection } from "@/components/sections/ContactSection";
import { FloatingMenu } from "@/components/FloatingMenu";

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    document.title = "SD Beauty Parlour — Where Beauty Meets Elegance";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Premium beauty salon offering hair styling, facials, bridal makeup, waxing, threading and more. Book your appointment today."
      );
    }
  }, []);

  useEffect(() => {
    const path = location.pathname.replace(/^\//, "");
    const hash = location.hash.replace(/^#/, "");
    const targetId = hash || path;
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <WhyChooseUs />
          <FeaturedBeauty />
          <ServicesSection />
          <OffersSection />
          <TeamSection />
          <BeforeAfter />
          <GallerySection />
          <CTASection />
          <BlogSection />
          <FAQSection />
          <MapsAndHours />
          <ContactSection />
        </main>
        <Footer />
        <FloatingMenu />
      </div>
    </>
  );
}

