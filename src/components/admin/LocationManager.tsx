import React, { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, logAuditTrail } from "@/lib/firebase";
import {
  MapPin,
  Search,
  Navigation,
  Save,
  Loader2,
  Eye,
  Sliders,
  MousePointerClick,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Workaround for Leaflet's default icon path resolving issues in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type LocationSettings = {
  salonName: string;
  latitude: number;
  longitude: number;
  address: string;
  googleMapsLink: string;
  updatedAt?: number;
};

type AnalyticsData = {
  views: number;
  directions: number;
  mapClicks: number;
  navClicks: number;
};

export function LocationManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  const [salonName, setSalonName] = useState("SD Beauty Parlour");
  const [latitude, setLatitude] = useState(22.5745);
  const [longitude, setLongitude] = useState(88.4312);
  const [address, setAddress] = useState("Sector V, Salt Lake, Kolkata, West Bengal, India");
  const [googleMapsLink, setGoogleMapsLink] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsSidebar, setShowResultsSidebar] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    views: 0,
    directions: 0,
    mapClicks: 0,
    navClicks: 0,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchMarkersRef = useRef<L.Marker[]>([]);

  // 1. Fetch current Location Settings & Analytics
  useEffect(() => {
    const unsubLocation = onSnapshot(doc(db, "settings", "location"), (snap) => {
      if (snap.exists()) {
        const d = snap.data() as LocationSettings;
        setSalonName(d.salonName || "SD Beauty Parlour");
        setLatitude(Number(d.latitude) || 22.5745);
        setLongitude(Number(d.longitude) || 88.4312);
        setAddress(d.address || "");
        setGoogleMapsLink(d.googleMapsLink || "");
      }
      setLoading(false);
    });

    const unsubAnalytics = onSnapshot(
      doc(db, "settings", "location_analytics"),
      (snap) => {
        if (snap.exists()) {
          setAnalytics(snap.data() as AnalyticsData);
        }
      }
    );

    return () => {
      unsubLocation();
      unsubAnalytics();
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    const initialCoords: L.LatLngExpression = [latitude, longitude];
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Disable default to use custom Google-style zoom controls
      scrollWheelZoom: true,
    }).setView(initialCoords, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker(initialCoords, {
      draggable: true,
      title: "Salon Location",
    }).addTo(map);

    // Initial guide popup
    marker.bindPopup(
      `<div class="p-1 text-xs">
        <p class="font-bold text-primary mb-1">SD Beauty Parlour</p>
        <p class="text-[10px] text-muted-foreground leading-normal">Drag this marker to the exact parlour location.</p>
      </div>`
    );

    marker.on("dragend", (e: any) => {
      const position = e.target.getLatLng();
      setLatitude(position.lat);
      setLongitude(position.lng);
      triggerReverseGeocoding(position.lat, position.lng);
      // Clear search markers upon manual drag
      setSearchResults([]);
      setShowResultsSidebar(false);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitude(lat);
      setLongitude(lng);
      marker.setLatLng([lat, lng]);
      triggerReverseGeocoding(lat, lng);
      // Clear search markers upon manual click
      setSearchResults([]);
      setShowResultsSidebar(false);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      // Clear any search markers on unmount
      searchMarkersRef.current.forEach((m) => m.remove());
      searchMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [loading]);

  // 3. Pan map and move marker when coordinates update externally
  const updateMapMarker = (lat: number, lng: number, zoomLevel = 15) => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], zoomLevel);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  // 4. Reverse geocoding via Nominatim
  const triggerReverseGeocoding = async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setReverseGeocoding(false);
    }
  };

  // 5. Use Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        updateMapMarker(lat, lng, 18); // Zoom in closer for high accuracy
        triggerReverseGeocoding(lat, lng);
        setSearchResults([]);
        setShowResultsSidebar(false);
        toast.success("Marker moved to your current location!");
      },
      (err) => {
        toast.error("Could not obtain location permission: " + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // Custom Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  // 6. Autocomplete suggestions list (Debounced typing)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setAutocompleteSuggestions([]);
      return;
    }

    // Don't autocomplete if typing direct coordinates
    const coordPattern = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    if (coordPattern.test(searchQuery.trim())) {
      setAutocompleteSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=6&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          setAutocompleteSuggestions(data);
        }
      } catch (err) {
        console.error("Autocomplete fetch error: ", err);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 7. Explicit Search Submission (Google Maps Style)
  const executeSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    // Check for coordinate pattern first
    const coordPattern = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    if (coordPattern.test(q)) {
      const parts = q.split(/[\s,]+/);
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLatitude(lat);
        setLongitude(lng);
        updateMapMarker(lat, lng, 18);
        triggerReverseGeocoding(lat, lng);
        setAutocompleteSuggestions([]);
        setSearchResults([]);
        setShowResultsSidebar(false);
        setSearchQuery("");
        toast.success("Navigated directly to coordinates!");
        return;
      }
    }

    setSearching(true);
    setAutocompleteSuggestions([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=10&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          toast.error("No locations found for this search.");
        } else {
          setSearchResults(data);
          setShowResultsSidebar(true);
          toast.success(`Found ${data.length} matching locations!`);
        }
      } else {
        toast.error("Search request failed.");
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
      toast.error("Error communicating with search service.");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    setLatitude(lat);
    setLongitude(lng);
    setAddress(item.display_name);
    updateMapMarker(lat, lng, 18); // Zoom 18 details
    setAutocompleteSuggestions([]);
    setSearchResults([]);
    setShowResultsSidebar(false);
    setSearchQuery("");
    toast.success("Focused on selected location! You can drag the red marker to fine-tune.");

    // Open guide popup on the marker
    if (markerRef.current) {
      markerRef.current.bindPopup(
        `<div class="p-1 text-xs">
          <p class="font-bold text-primary mb-1">Salon Pin Location</p>
          <p class="text-[10px] text-muted-foreground leading-normal">Drag this marker to fine-tune the exact parlour entrance.</p>
        </div>`
      ).openPopup();
    }
  };

  // 8. Synchronize Search Result Pins on the Map
  useEffect(() => {
    // Clear previous search markers
    searchMarkersRef.current.forEach((m) => m.remove());
    searchMarkersRef.current = [];

    if (!mapRef.current || searchResults.length === 0) return;

    const bounds = L.latLngBounds([]);

    searchResults.forEach((item, idx) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (isNaN(lat) || isNaN(lng)) return;

      const road =
        item.address?.road ||
        item.address?.suburb ||
        item.address?.neighbourhood ||
        item.address?.city ||
        "Location Result";

      const searchMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div class="relative group flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 border-2 border-white shadow-premium flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95">
              <span class="text-white text-xs font-extrabold font-mono">${idx + 1}</span>
            </div>
          </div>`,
          className: "bg-transparent border-none",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
        title: item.display_name,
      }).addTo(mapRef.current!);

      searchMarker.bindTooltip(road, {
        permanent: false,
        direction: "top",
        className: "bg-background text-foreground border border-border text-[10px] font-bold rounded px-1.5 py-0.5 shadow-sm"
      });

      searchMarker.on("click", () => {
        selectSearchResult(item);
      });

      searchMarkersRef.current.push(searchMarker);
      bounds.extend([lat, lng]);
    });

    if (searchResults.length > 0 && mapRef.current) {
      if (searchResults.length === 1) {
        const first = searchResults[0];
        mapRef.current.setView([Number(first.lat), Number(first.lon)], 16);
      } else {
        mapRef.current.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [searchResults]);

  // 9. Save to Firestore
  const handleSave = async () => {
    setSaving(false);
    const mapsLink =
      googleMapsLink.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "location"), {
        salonName,
        latitude,
        longitude,
        address,
        googleMapsLink: mapsLink,
        updatedAt: Date.now(),
      });

      await logAuditTrail(
        "location_settings_update",
        `Updated coordinates to [${latitude}, ${longitude}], Address: "${address}"`
      );

      toast.success("Location settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save location details.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Location Analytics Widget */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-soft">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" /> Location Analytics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-secondary/20 border border-border/60 p-4 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Location Views
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-foreground">
              {analytics.views}
            </div>
          </div>
          <div className="bg-secondary/20 border border-border/60 p-4 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Directions Requests
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-primary">
              {analytics.directions}
            </div>
          </div>
          <div className="bg-secondary/20 border border-border/60 p-4 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Map Clicks
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-foreground">
              {analytics.mapClicks}
            </div>
          </div>
          <div className="bg-secondary/20 border border-border/60 p-4 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Navigation Launches
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-gradient-rose">
              {analytics.navClicks}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Map Layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Interactive Map */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft flex flex-col relative">
            
            {/* Floating Search Bar (Google Maps style) */}
            <div className="absolute top-4 left-4 right-4 z-20 max-w-md pointer-events-auto">
              <div className="relative bg-background/95 backdrop-blur-md shadow-premium border border-border rounded-2xl p-2 flex items-center gap-1">
                <Search className="h-4.5 w-4.5 text-muted-foreground ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search location or paste coordinates (lat, lng)..."
                  className="flex-grow text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-foreground px-2 py-1.5 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeSearch(searchQuery);
                    }
                  }}
                />
                {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0 mr-1" />}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setAutocompleteSuggestions([]);
                      setSearchResults([]);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-bold px-2 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                )}
                <div className="h-6 w-[1px] bg-border mx-1 shrink-0" />
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery)}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-[11px] transition-colors shrink-0 cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Autocomplete Suggestions dropdown (only shown during active typing) */}
              {autocompleteSuggestions.length > 0 && (
                <div className="bg-background border border-border rounded-2xl mt-2 divide-y divide-border shadow-premium max-h-60 overflow-y-auto z-30">
                  {autocompleteSuggestions.map((item, idx) => {
                    const road =
                      item.address?.road ||
                      item.address?.suburb ||
                      item.address?.neighbourhood ||
                      item.address?.city ||
                      "Search Result";
                    return (
                      <button
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        className="w-full text-left px-4 py-3 hover:bg-secondary text-xs text-foreground flex items-start gap-2.5 transition-colors"
                      >
                        <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground truncate max-w-[280px]">
                            {road}
                          </span>
                          <span className="text-muted-foreground text-[10px] truncate max-w-[320px]">
                            {item.display_name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Results Sidebar/Drawer (Google Maps style) */}
            {searchResults.length > 0 && showResultsSidebar && (
              <>
                {/* Desktop Sidebar Panel */}
                <div className="absolute top-20 bottom-4 left-4 z-20 w-80 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-premium flex flex-col overflow-hidden animate-in slide-in-from-left duration-300 hidden lg:flex">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/10 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">Search Results</span>
                      <span className="text-[10px] text-muted-foreground">{searchResults.length} places found</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchResults([]);
                        setShowResultsSidebar(false);
                      }}
                      className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                    {searchResults.map((item, idx) => {
                      const road =
                        item.address?.road ||
                        item.address?.suburb ||
                        item.address?.neighbourhood ||
                        item.address?.city ||
                        "Location Result";
                      return (
                        <button
                          key={idx}
                          onClick={() => selectSearchResult(item)}
                          onMouseEnter={() => {
                            searchMarkersRef.current[idx]?.openTooltip();
                          }}
                          onMouseLeave={() => {
                            searchMarkersRef.current[idx]?.closeTooltip();
                          }}
                          className="w-full text-left p-3.5 hover:bg-secondary/60 transition-colors flex items-start gap-3 cursor-pointer group"
                        >
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-600 transition-colors">
                            {idx + 1}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                              {road}
                            </span>
                            <span className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-normal">
                              {item.display_name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Drawer Panel */}
                <div className="absolute bottom-16 left-4 right-4 z-20 max-h-52 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-premium flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 lg:hidden">
                  <div className="p-3 border-b border-border flex items-center justify-between bg-secondary/10 shrink-0">
                    <span className="text-xs font-bold text-foreground">Search Results ({searchResults.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchResults([]);
                        setShowResultsSidebar(false);
                      }}
                      className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                    {searchResults.map((item, idx) => {
                      const road =
                        item.address?.road ||
                        item.address?.suburb ||
                        item.address?.neighbourhood ||
                        item.address?.city ||
                        "Location Result";
                      return (
                        <button
                          key={idx}
                          onClick={() => selectSearchResult(item)}
                          className="w-full text-left p-3 hover:bg-secondary/60 transition-colors flex items-start gap-2.5 cursor-pointer"
                        >
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-foreground truncate">
                              {road}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate">
                              {item.display_name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Leaflet container */}
            <div
              ref={mapContainerRef}
              className="h-[520px] w-full bg-muted z-10"
              style={{ minHeight: "420px" }}
            />

            {/* Google Maps Style Control Group on Bottom-Right */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
              {/* Compass Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="h-10 w-10 bg-background/95 backdrop-blur-md hover:bg-background border border-border rounded-xl shadow-premium flex items-center justify-center text-primary transition-all active:scale-95 cursor-pointer"
                title="Use current location"
              >
                <Navigation className="h-4.5 w-4.5 fill-primary" />
              </button>

              {/* Zoom Buttons */}
              <div className="flex flex-col border border-border rounded-xl bg-background/95 backdrop-blur-md shadow-premium overflow-hidden">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="h-10 w-10 hover:bg-secondary text-foreground font-semibold flex items-center justify-center border-b border-border transition-colors cursor-pointer text-lg"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="h-10 w-10 hover:bg-secondary text-foreground font-semibold flex items-center justify-center transition-colors cursor-pointer text-lg"
                  title="Zoom Out"
                >
                  −
                </button>
              </div>
            </div>

            {/* Helper Overlay footer */}
            <div className="absolute bottom-4 left-4 z-20 bg-background/85 backdrop-blur-sm border border-border px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 text-primary" /> Drag the red marker or click anywhere on the map to pin.
              </span>
            </div>
          </div>
        </div>

        {/* Right Details/Save Form */}
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-5">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" /> Map Configuration
          </h3>

          {/* Form fields */}
          <div className="space-y-4 text-xs">
            <label className="block space-y-1.5">
              <span className="font-semibold text-muted-foreground">Salon / Parlour Name</span>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm font-medium"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="font-semibold text-muted-foreground">Latitude</span>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm font-mono"
                  value={latitude}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLatitude(val);
                    updateMapMarker(val, longitude);
                  }}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-muted-foreground">Longitude</span>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm font-mono"
                  value={longitude}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLongitude(val);
                    updateMapMarker(latitude, val);
                  }}
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="font-semibold text-muted-foreground flex items-center justify-between">
                <span>Display Address</span>
                {reverseGeocoding && (
                  <span className="text-[10px] text-primary flex items-center gap-1 animate-pulse">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Fetching address...
                  </span>
                )}
              </span>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm leading-relaxed"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <span>Google Maps URL (Optional)</span>
                <Info className="h-3 w-3 text-muted-foreground" title="Leave blank to auto-generate a search link from pinned coordinates." />
              </span>
              <input
                type="url"
                placeholder="https://g.page/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
              />
            </label>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-gradient-rose hover:scale-[1.01] transition-transform text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-soft flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Saving Coordinates..." : "Save Location Settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
