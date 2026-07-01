import React, { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase";
import { ThemeProvider } from "./lib/theme";
import "./styles.css";

// Pages
import Index from "./routes/index";
import AboutPage from "./routes/about";
import AdminPage from "./routes/admin";
import BlogPage from "./routes/blog";
import DeveloperPage from "./routes/developer";

const queryClient = new QueryClient();

// Custom hook to fetch dynamic schema details from Firestore
function useSalonSchema() {
  const [salonData, setSalonData] = useState<any>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "settings", "contact"), (snap) => {
      if (snap.exists()) {
        setSalonData(snap.data());
      }
    });
  }, []);

  if (!salonData) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": salonData.salonName || "SD Beauty Parlour",
    "image": salonData.contactSectionImages?.[0] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200",
    "@id": "https://sdbeautyparlour.firebaseapp.com/#salon",
    "url": "https://sdbeautyparlour.firebaseapp.com/",
    "telephone": salonData.phone1 || "+91 79901 01983",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": salonData.address || "Sector V, Salt Lake",
      "addressLocality": salonData.city || "Kolkata",
      "addressRegion": salonData.state || "West Bengal",
      "postalCode": salonData.pincode || "700091",
      "addressCountry": salonData.country || "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 22.574528,
      "longitude": 88.431264
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": salonData.mondayOpen || "10:00",
        "closes": salonData.mondayClose || "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": salonData.sundayOpen || "10:00",
        "closes": salonData.sundayClose || "18:00"
      }
    ],
    "sameAs": [
      salonData.facebook || "https://facebook.com/sdbeautyparlour",
      salonData.instagram || "https://instagram.com/sdbeautyparlour"
    ]
  };
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = useSalonSchema();

  useEffect(() => {
    // Inject the structured JSON-LD schema dynamically
    const existingScript = document.getElementById("salon-structured-data");
    if (existingScript) {
      existingScript.remove();
    }

    if (schema) {
      const script = document.createElement("script");
      script.id = "salon-structured-data";
      script.type = "application/ld+json";
      script.innerHTML = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [schema]);

  return <>{children}</>;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <RootLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/*" element={<AdminPage />} />
                <Route path="/blog/:id" element={<BlogPage />} />
                <Route path="/developer" element={<DeveloperPage />} />
                {/* Fallbacks for anchor paths so typing /services loads Index page */}
                <Route path="/services" element={<Index />} />
                <Route path="/gallery" element={<Index />} />
                <Route path="/contact" element={<Index />} />
                <Route path="/appointment" element={<Index />} />
                <Route path="*" element={<NotFoundComponent />} />
              </Routes>
            </RootLayout>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
