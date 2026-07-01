import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  Navigation,
  Sparkles,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Globe,
  Loader2,
  Car,
  Footprints,
  Bike,
} from "lucide-react";
import { db, trackLocationMetric } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Workaround for Leaflet icon loading
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type ContactData = {
  heading?: string;
  description?: string;
  mondayOpen?: string;
  mondayClose?: string;
  tuesdayOpen?: string;
  tuesdayClose?: string;
  wednesdayOpen?: string;
  wednesdayClose?: string;
  thursdayOpen?: string;
  thursdayClose?: string;
  fridayOpen?: string;
  fridayClose?: string;
  saturdayOpen?: string;
  saturdayClose?: string;
  sundayOpen?: string;
  sundayClose?: string;
  holidayNotes?: string;
  salonName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone1?: string;
  phone2?: string;
  whatsapp?: string;
  email?: string;
  supportEmail?: string;
  emergencyContact?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  whatsappUrl?: string;
  googleBusiness?: string;
  website?: string;
  mapsUrl?: string;
  contactSectionImages?: string[];
  ctaText?: string;
  ctaLink?: string;
  ctaType?: "form" | "whatsapp" | "appointment" | "external";
  expYears?: string;
  happyClients?: string;
  beautyExperts?: string;
  servicesCount?: string;
  whatsappInquiryText?: string;
};

const DEFAULT_CONTACT_DATA: ContactData = {
  heading: "Visit Our Parlour",
  description: "Step into our sanctuary of peace and self-care. Let our professionals transform your look.",
  mondayOpen: "10:00 AM",
  mondayClose: "08:00 PM",
  tuesdayOpen: "10:00 AM",
  tuesdayClose: "08:00 PM",
  wednesdayOpen: "10:00 AM",
  wednesdayClose: "08:00 PM",
  thursdayOpen: "10:00 AM",
  thursdayClose: "08:00 PM",
  fridayOpen: "10:00 AM",
  fridayClose: "08:00 PM",
  saturdayOpen: "10:00 AM",
  saturdayClose: "08:00 PM",
  sundayOpen: "10:00 AM",
  sundayClose: "06:00 PM",
  holidayNotes: "Closed on Public Holidays",
  salonName: "SD Beauty Parlour",
  address: "SD Beauty Parlour, Sector V, Salt Lake",
  city: "Kolkata",
  state: "West Bengal",
  country: "India",
  pincode: "700091",
  phone1: "+91 79901 01983",
  phone2: "",
  whatsapp: "917990101983",
  email: "pawarparth233@gmail.com",
  instagram: "https://instagram.com/sdbeautyparlour",
  facebook: "https://facebook.com/sdbeautyparlour",
  whatsappUrl: "https://wa.me/917990101983",
  mapsUrl: "",
  contactSectionImages: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600",
    "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600",
  ],
  ctaText: "Schedule Visit",
  ctaLink: "#contact",
  ctaType: "form",
  expYears: "10+ Years",
  happyClients: "5000+",
  beautyExperts: "10+",
  servicesCount: "50+",
  whatsappInquiryText: "Hello! I'd like to book an appointment for a premium service at SD Beauty Parlour.",
};

const kenBurnsVariants = {
  initial: { scale: 1.15, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      scale: { duration: 6, ease: "linear" },
      opacity: { duration: 0.8 },
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.8 },
  },
};

export function MapsAndHours() {
  const [data, setData] = useState<ContactData>(DEFAULT_CONTACT_DATA);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Map & Directions state
  const [locationSettings, setLocationSettings] = useState({
    salonName: "SD Beauty Parlour",
    latitude: 22.5745,
    longitude: 88.4312,
    address: "Sector V, Salt Lake, Kolkata, West Bengal, India",
    googleMapsLink: "",
  });

  const [visitorCoords, setVisitorCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "bike">("driving");
  const [distance, setDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<number | null>(null);
  const [trackingLocation, setTrackingLocation] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(false);

  const visitorMapContainerRef = useRef<HTMLDivElement>(null);
  const visitorMapRef = useRef<L.Map | null>(null);
  const visitorMarkerRef = useRef<L.Marker | null>(null);

  // 1. Log view event on mount
  useEffect(() => {
    trackLocationMetric("views");
  }, []);

  // 2. Load Firestore location settings
  useEffect(() => {
    const unsubLocation = onSnapshot(doc(db, "settings", "location"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setLocationSettings({
          salonName: d.salonName || "SD Beauty Parlour",
          latitude: Number(d.latitude) || 22.5745,
          longitude: Number(d.longitude) || 88.4312,
          address: d.address || "Sector V, Salt Lake, Kolkata, West Bengal, India",
          googleMapsLink: d.googleMapsLink || "",
        });
      }
    });
    return unsubLocation;
  }, []);

  // 3. Render Leaflet Map
  useEffect(() => {
    if (!visitorMapContainerRef.current) return;

    const lat = locationSettings.latitude;
    const lng = locationSettings.longitude;

    const map = L.map(visitorMapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker([lat, lng], {
      title: locationSettings.salonName,
    }).addTo(map);

    marker.bindPopup(`<b>${locationSettings.salonName}</b><br/>${locationSettings.address}`).openPopup();

    map.on("click", () => {
      trackLocationMetric("mapClicks");
    });

    visitorMapRef.current = map;
    visitorMarkerRef.current = marker;

    return () => {
      map.remove();
      visitorMapRef.current = null;
      visitorMarkerRef.current = null;
    };
  }, [locationSettings.latitude, locationSettings.longitude, locationSettings.salonName]);

  // 4. Fetch business hours contact config
  useEffect(() => {
    return onSnapshot(
      doc(db, "settings", "contact"),
      (snap) => {
        if (snap.exists()) {
          setData({ ...DEFAULT_CONTACT_DATA, ...snap.data() });
        } else {
          onSnapshot(doc(db, "settings", "business"), (bizSnap) => {
            if (bizSnap.exists()) {
              const b = bizSnap.data();
              const hoursMonSat = b.hoursMonSat || "10:00 AM - 08:00 PM";
              const hoursSun = b.hoursSun || "10:00 AM - 06:00 PM";
              const [monSatOpen, monSatClose] = hoursMonSat.split(" - ");
              const [sunOpen, sunClose] = hoursSun.split(" - ");

              setData((prev) => ({
                ...prev,
                salonName: b.name || "SD Beauty Parlour",
                phone1: b.phone || "+91 79901 01983",
                whatsapp: b.whatsapp || "917990101983",
                email: b.email || "pawarparth233@gmail.com",
                address: b.address || "SD Beauty Parlour, Sector V, Salt Lake",
                instagram: b.instagram || "https://instagram.com/sdbeautyparlour",
                facebook: b.facebook || "https://facebook.com/sdbeautyparlour",
                mondayOpen: monSatOpen || "10:00 AM",
                mondayClose: monSatClose || "08:00 PM",
                tuesdayOpen: monSatOpen || "10:00 AM",
                tuesdayClose: monSatClose || "08:00 PM",
                wednesdayOpen: monSatOpen || "10:00 AM",
                wednesdayClose: monSatClose || "08:00 PM",
                thursdayOpen: monSatOpen || "10:00 AM",
                thursdayClose: monSatClose || "08:00 PM",
                fridayOpen: monSatOpen || "10:00 AM",
                fridayClose: monSatClose || "08:00 PM",
                saturdayOpen: monSatOpen || "10:00 AM",
                saturdayClose: monSatClose || "08:00 PM",
                sundayOpen: sunOpen || "10:00 AM",
                sundayClose: sunClose || "06:00 PM",
              }));
            }
          });
        }
      },
      () => {
        setData(DEFAULT_CONTACT_DATA);
      }
    );
  }, []);

  const imagesList =
    data.contactSectionImages && data.contactSectionImages.length > 0
      ? data.contactSectionImages
      : DEFAULT_CONTACT_DATA.contactSectionImages || [];

  useEffect(() => {
    if (imagesList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % imagesList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [imagesList]);

  // Geolocation & Directions Calculators
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const calculateTravelTime = (dist: number, mode: "driving" | "walking" | "bike") => {
    let speed = 40; // Driving standard (40 km/h)
    if (mode === "bike") speed = 20; // Bike standard (20 km/h)
    if (mode === "walking") speed = 5; // Walking standard (5 km/h)

    const timeHours = dist / speed;
    const timeMins = Math.round(timeHours * 60);
    setTravelTime(timeMins || 1);
  };

  useEffect(() => {
    if (distance !== null) {
      calculateTravelTime(distance, travelMode);
    }
  }, [travelMode, distance]);

  const handleGetDirections = () => {
    trackLocationMetric("directions");
    setTrackingLocation(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setTrackingLocation(false);
      handleLaunchNavigation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const vLat = pos.coords.latitude;
        const vLng = pos.coords.longitude;
        setVisitorCoords({ latitude: vLat, longitude: vLng });

        const dist = calculateHaversine(vLat, vLng, locationSettings.latitude, locationSettings.longitude);
        setDistance(dist);
        calculateTravelTime(dist, travelMode);
        setShowRouteInfo(true);
        setTrackingLocation(false);
        toast.success("Current location successfully synced!");
      },
      (err) => {
        console.warn("Geolocation permission error: ", err);
        setTrackingLocation(false);
        toast.info("Using default routes to navigation.");
        handleLaunchNavigation();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleLaunchNavigation = () => {
    trackLocationMetric("navClicks");

    const destLat = locationSettings.latitude;
    const destLng = locationSettings.longitude;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    let url = "";
    if (visitorCoords) {
      const srcLat = visitorCoords.latitude;
      const srcLng = visitorCoords.longitude;
      if (isAndroid) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${srcLat},${srcLng}&destination=${destLat},${destLng}&travelmode=${
          travelMode === "bike" ? "bicycling" : travelMode
        }`;
      } else if (isIOS) {
        url = `https://maps.apple.com/maps?saddr=${srcLat},${srcLng}&daddr=${destLat},${destLng}&dirflg=${
          travelMode === "walking" ? "w" : "d"
        }`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&origin=${srcLat},${srcLng}&destination=${destLat},${destLng}&travelmode=${
          travelMode === "bike" ? "bicycling" : travelMode
        }`;
      }
    } else {
      url =
        locationSettings.googleMapsLink ||
        `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
    }

    window.open(url, "_blank");
  };

  const getFullAddress = () => {
    if (!data.address) return locationSettings.address;
    const parts = [data.address, data.city, data.state, data.country].filter(Boolean);
    return parts.join(", ") + (data.pincode ? ` - ${data.pincode}` : "");
  };

  const getOpenStatus = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    const dayName = days[now.getDay()];
    const openKey = `${dayName}Open` as keyof ContactData;
    const closeKey = `${dayName}Close` as keyof ContactData;
    const openTimeStr = data[openKey] as string;
    const closeTimeStr = data[closeKey] as string;

    if (!openTimeStr || !closeTimeStr) return { isOpen: false, text: "Closed" };

    const parseTime = (str: string) => {
      const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const openMin = parseTime(openTimeStr);
    const closeMin = parseTime(closeTimeStr);
    if (openMin === null || closeMin === null) return { isOpen: false, text: "Closed" };

    const currentMin = now.getHours() * 60 + now.getMinutes();

    if (currentMin >= openMin && currentMin < closeMin) {
      return { isOpen: true, text: "Open Now" };
    }
    return { isOpen: false, text: "Closed" };
  };

  const handleCtaClick = () => {
    if (data.ctaType === "whatsapp") {
      const text =
        data.whatsappInquiryText ||
        "Hello! I'd like to book an appointment for a premium service at SD Beauty Parlour.";
      const waNumber = data.whatsapp || "917990101983";
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
    } else if (data.ctaType === "external") {
      window.open(data.ctaLink || "#", "_blank");
    } else {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentStatus = getOpenStatus();
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayName = daysOfWeek[new Date().getDay()];

  const scheduleDays = [
    {
      label: "Monday",
      openKey: "mondayOpen" as keyof ContactData,
      closeKey: "mondayClose" as keyof ContactData,
      name: "monday",
    },
    {
      label: "Tuesday",
      openKey: "tuesdayOpen" as keyof ContactData,
      closeKey: "tuesdayClose" as keyof ContactData,
      name: "tuesday",
    },
    {
      label: "Wednesday",
      openKey: "wednesdayOpen" as keyof ContactData,
      closeKey: "wednesdayClose" as keyof ContactData,
      name: "wednesday",
    },
    {
      label: "Thursday",
      openKey: "thursdayOpen" as keyof ContactData,
      closeKey: "thursdayClose" as keyof ContactData,
      name: "thursday",
    },
    {
      label: "Friday",
      openKey: "fridayOpen" as keyof ContactData,
      closeKey: "fridayClose" as keyof ContactData,
      name: "friday",
    },
    {
      label: "Saturday",
      openKey: "saturdayOpen" as keyof ContactData,
      closeKey: "saturdayClose" as keyof ContactData,
      name: "saturday",
    },
    {
      label: "Sunday",
      openKey: "sundayOpen" as keyof ContactData,
      closeKey: "sundayClose" as keyof ContactData,
      name: "sunday",
    },
  ];

  return (
    <section id="maps-and-hours" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent/40 text-accent-foreground text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Location & Schedule
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-gradient-rose">
            {data.heading}
          </h2>
          <p className="text-muted-foreground mt-4 text-sm md:text-base leading-relaxed">
            {data.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          {/* Business hours and contact info column (Left) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Hours card */}
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 md:p-8 shadow-soft flex flex-col justify-between flex-grow">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-primary" /> Salon Schedule
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      currentStatus.isOpen
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        currentStatus.isOpen ? "bg-green-500" : "bg-red-500"
                      } animate-pulse`}
                    />
                    {currentStatus.text}
                  </span>
                </div>

                <div className="space-y-3">
                  {scheduleDays.map((item) => {
                    const isToday = item.name === currentDayName;
                    const openVal = data[item.openKey] as string;
                    const closeVal = data[item.closeKey] as string;
                    const isOpenToday = !!(openVal && closeVal);
                    return (
                      <div
                        key={item.name}
                        className={`flex justify-between items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                          isToday
                            ? "bg-accent/40 border border-primary/20 shadow-sm"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            isToday ? "font-bold text-primary" : "font-medium text-foreground"
                          }`}
                        >
                          {item.label}
                          {isToday && (
                            <span className="text-[9px] ml-1.5 uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                              Today
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground font-semibold">
                          {isOpenToday ? `${openVal} - ${closeVal}` : "Closed"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {data.holidayNotes && (
                  <p className="text-xs text-muted-foreground/80 italic flex items-center gap-1.5 pt-2 border-t border-border/40">
                    <span className="inline-block h-1 w-1 rounded-full bg-primary" />
                    {data.holidayNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Details card */}
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Navigation className="h-4.5 w-4.5 text-primary" /> Contact Details
              </h3>

              <div className="space-y-4">
                {/* Address */}
                {getFullAddress() && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-accent/40 text-primary shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Address
                      </span>
                      <span className="text-sm text-foreground leading-relaxed">
                        {getFullAddress()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Phones */}
                {(data.phone1 || data.phone2 || data.emergencyContact) && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-accent/40 text-primary shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Phone Contacts
                      </span>
                      <div className="flex flex-col gap-1 text-sm">
                        {data.phone1 && (
                          <a
                            href={`tel:${data.phone1}`}
                            className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {data.phone1}{" "}
                            <span className="text-[10px] text-muted-foreground font-medium">
                              (Primary)
                            </span>
                          </a>
                        )}
                        {data.phone2 && (
                          <a
                            href={`tel:${data.phone2}`}
                            className="text-foreground hover:text-primary transition-colors"
                          >
                            {data.phone2}
                          </a>
                        )}
                        {data.emergencyContact && (
                          <a
                            href={`tel:${data.emergencyContact}`}
                            className="text-red-500 font-semibold hover:underline"
                          >
                            Emergency: {data.emergencyContact}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Emails */}
                {(data.email || data.supportEmail) && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-accent/40 text-primary shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Email Correspondence
                      </span>
                      <div className="flex flex-col gap-1 text-sm">
                        {data.email && (
                          <a
                            href={`mailto:${data.email}`}
                            className="text-foreground hover:text-primary transition-colors break-all"
                          >
                            {data.email}
                          </a>
                        )}
                        {data.supportEmail && (
                          <a
                            href={`mailto:${data.supportEmail}`}
                            className="text-muted-foreground hover:text-primary transition-colors text-xs break-all"
                          >
                            Support: {data.supportEmail}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Badges */}
                {(data.instagram || data.facebook || data.youtube || data.website) && (
                  <div className="pt-2 flex items-center gap-2.5">
                    {data.instagram && (
                      <a
                        href={data.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {data.facebook && (
                      <a
                        href={data.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {data.youtube && (
                      <a
                        href={data.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
                        aria-label="Youtube"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                    )}
                    {data.website && (
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
                        aria-label="Website"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Media & Maps column (Right) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Sliding Showcase Image Carousel */}
            <div className="h-64 md:h-80 rounded-3xl overflow-hidden border border-border bg-card shadow-soft relative group">
              <AnimatePresence mode="wait">
                {imagesList.length > 0 ? (
                  <motion.img
                    key={currentImgIndex}
                    src={imagesList[currentImgIndex]}
                    variants={kenBurnsVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={`${data.salonName || "Salon"} interior showcase`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-primary/30" />
                  </div>
                )}
              </AnimatePresence>

              {/* Glassmorphism Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white z-20 flex justify-between items-center shadow-lg">
                <div>
                  <h4 className="font-semibold font-display text-sm flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Salon Ambience
                  </h4>
                  <p className="text-white/80 text-[10px] uppercase tracking-wider mt-0.5">
                    Premium space designed for your comfort
                  </p>
                </div>
                {imagesList.length > 1 && (
                  <div className="flex gap-1.5">
                    {imagesList.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImgIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          currentImgIndex === i ? "w-4 bg-primary" : "w-1.5 bg-white/40"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Free Interactive Leaflet Map */}
            <div className="flex-grow min-h-[350px] bg-muted rounded-3xl overflow-hidden border border-border shadow-soft relative group flex flex-col">
              <div
                ref={visitorMapContainerRef}
                className="absolute inset-0 w-full h-[75%] z-10"
              />
              
              {/* Directions UI Bar inside the map card */}
              <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-card border-t border-border z-20 px-4 py-3 flex items-center justify-between gap-4">
                {!showRouteInfo ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-xs text-muted-foreground font-medium pr-2 truncate">
                      {locationSettings.address}
                    </div>
                    <button
                      onClick={handleGetDirections}
                      disabled={trackingLocation}
                      className="shrink-0 px-4 py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft"
                    >
                      {trackingLocation ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Navigation className="h-3.5 w-3.5 fill-white" />
                      )}
                      <span>Get Directions</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col w-full gap-1 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-foreground">
                        {locationSettings.salonName} is <span className="text-primary">{distance} km</span> away.
                      </span>
                      <button
                        onClick={handleLaunchNavigation}
                        className="px-3.5 py-1.5 bg-gradient-rose text-white text-[10px] font-bold rounded-lg shadow-sm hover:scale-[1.02] transition-transform flex items-center gap-1 cursor-pointer"
                      >
                        <Navigation className="h-3 w-3 fill-white" /> Open Route
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex gap-1.5">
                        {[
                          { mode: "driving", icon: Car, label: "Driving" },
                          { mode: "bike", icon: Bike, label: "Bike" },
                          { mode: "walking", icon: Footprints, label: "Walk" },
                        ].map((item) => {
                          const Icon = item.icon;
                          const active = travelMode === item.mode;
                          return (
                            <button
                              key={item.mode}
                              onClick={() => setTravelMode(item.mode as any)}
                              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                active
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border hover:bg-secondary text-muted-foreground"
                              }`}
                              title={item.label}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold font-mono">
                        Est. time: {travelTime} mins ({travelMode})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call to action & performance counters section */}
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 shadow-soft space-y-6">
              {/* Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: data.expYears || "10+ Yrs", label: "Experience" },
                  { value: data.happyClients || "5000+", label: "Happy Guests" },
                  { value: data.beautyExperts || "10+", label: "Artistry Experts" },
                  { value: data.servicesCount || "50+", label: "Services" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-2xl bg-accent/25 border border-border/60">
                    <span className="block text-xl font-bold text-primary font-display">
                      {stat.value}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1 block">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action trigger button */}
              <div className="pt-2">
                <button
                  onClick={handleCtaClick}
                  className="w-full py-4 rounded-full gradient-gold-champagne text-white font-bold text-sm tracking-wider uppercase shadow-soft hover:scale-[1.01] hover:shadow-premium transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  {data.ctaType === "whatsapp" && <MessageCircle className="h-4.5 w-4.5 animate-pulse" />}
                  {data.ctaText || "Book Your Visit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
