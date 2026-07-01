import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Image as ImageIcon,
  CalendarCheck,
  LogOut,
  Moon,
  Sun,
  Scissors,
  Users,
  MessageSquare,
  Tag,
  BookOpen,
  HelpCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  Menu,
  X,
  MapPin,
  Maximize,
  Minimize,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ServicesManager } from "./ServicesManager";
import { GalleryManager } from "./GalleryManager";
import { AppointmentsManager } from "./AppointmentsManager";
import { TeamManager } from "./TeamManager";
import { OffersManager } from "./OffersManager";
import { BlogManager } from "./BlogManager";
import { FAQsManager } from "./FAQsManager";
import { SettingsManager } from "./SettingsManager";
import { FinancialsManager } from "./FinancialsManager";
import { LocationManager } from "./LocationManager";
import logo from "@/assets/logo.png";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type Tab =
  | "analytics"
  | "appointments"
  | "services"
  | "gallery"
  | "team"
  | "promotions"
  | "blog"
  | "faqs"
  | "settings"
  | "financials"
  | "location";

type DashboardAppointment = {
  id: string;
  status?: string;
  service?: string;
  date?: string;
};

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("analytics");
  const { theme, toggle } = useTheme();
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fetch all appointments for metrics
  useEffect(() => {
    const q = query(collection(db, "appointments"));
    return onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DashboardAppointment));
    });
  }, []);

  const groups = [
    {
      title: "Overview",
      items: [
        { id: "analytics" as Tab, label: "Analytics", icon: LayoutGrid },
        { id: "appointments" as Tab, label: "Appointments", icon: CalendarCheck },
        { id: "financials" as Tab, label: "Financial Management", icon: DollarSign },
      ],
    },
    {
      title: "Client Facing",
      items: [
        { id: "location" as Tab, label: "Location Manager", icon: MapPin },
        { id: "services" as Tab, label: "Services", icon: Scissors },
        { id: "gallery" as Tab, label: "Gallery", icon: ImageIcon },
        { id: "promotions" as Tab, label: "Promotions", icon: Tag },
      ],
    },
    {
      title: "System Settings",
      items: [
        { id: "team" as Tab, label: "Team", icon: Users },
        { id: "blog" as Tab, label: "Blog", icon: BookOpen },
        { id: "faqs" as Tab, label: "FAQs", icon: HelpCircle },
        { id: "settings" as Tab, label: "Settings", icon: Sliders },
      ],
    },
  ];

  // Helper: Extract price integer
  const extractPriceNum = (p: string) => {
    const match = p.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Metrics calculations
  const total = appointments.length;
  const pending = appointments.filter((a) => a.status === "pending" || !a.status).length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  const estimatedRevenue = appointments
    .filter((a) => a.status === "confirmed" || a.status === "completed")
    .reduce((sum, current) => sum + extractPriceNum(current.service || ""), 0);

  // Recharts chart data (Grouped by date)
  const dateCounts: Record<string, number> = {};
  appointments
    .filter((a) => a.date)
    .forEach((a) => {
      dateCounts[a.date] = (dateCounts[a.date] || 0) + 1;
    });

  const chartData = Object.keys(dateCounts)
    .sort()
    .slice(-7) // Last 7 days
    .map((date) => ({
      date: date.substring(5), // MM-DD
      Bookings: dateCounts[date],
    }));

  return (
    <div className="min-h-screen bg-secondary/15 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="flex md:hidden h-16 bg-card border-b border-border sticky top-0 z-40 items-center justify-between px-6 w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-secondary text-foreground cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="" className="h-8 w-8 object-contain" />
          <span className="font-display font-bold text-gradient-rose text-sm">
            SD Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle fullscreen"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl hover:bg-destructive/10 text-destructive cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer (overlay) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#F8F9FA] dark:bg-[#0E0E10] border-r border-border/50 z-50 md:hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Branding */}
                <div className="p-6 flex items-center justify-between border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <img src={logo} alt="" className="h-8 w-8 object-contain" />
                    <div>
                      <div className="font-display font-bold text-gradient-rose leading-none text-base">
                        SD Admin
                      </div>
                      <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-semibold mt-1">
                        Luxury Panel
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                  {groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase px-3 block">
                        {group.title}
                      </span>
                      <div className="space-y-1">
                        {group.items.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTab(t.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 rounded-xl text-[13px] font-medium flex items-center gap-3 transition-all cursor-pointer hover:translate-x-[2px] ${
                              tab === t.id
                                ? "gradient-rose text-white shadow-soft font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                            }`}
                          >
                            <t.icon className="h-4 w-4" />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Footer actions */}
              <div className="p-4 border-t border-border/60 flex items-center justify-between gap-1">
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Toggle fullscreen"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
                </button>
                <button
                  onClick={toggle}
                  className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl hover:bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-[#F8F9FA] dark:bg-[#0E0E10] border-r border-border/50 shrink-0 z-30 sticky top-0 h-screen flex-col justify-between">
        <div>
          {/* Header Branding */}
          <div className="p-6 flex items-center gap-3 border-b border-border/60">
            <img src={logo} alt="" className="h-10 w-10 object-contain" />
            <div>
              <div className="font-display font-bold text-gradient-rose leading-none text-base">
                SD Admin
              </div>
              <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-semibold mt-1">
                Luxury Panel
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase px-3 block">
                  {group.title}
                </span>
                <div className="space-y-1">
                  {group.items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`w-full px-4 py-2 rounded-xl text-[13px] font-medium flex items-center gap-3 transition-all cursor-pointer hover:translate-x-[2px] ${
                        tab === t.id
                          ? "gradient-rose text-white shadow-soft font-semibold scale-[1.02]"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border/60 flex items-center justify-between gap-1">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle fullscreen"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl hover:bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-4 md:p-10 md:max-h-screen md:overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-3xl font-bold font-display capitalize text-foreground">{tab}</h1>
        </div>

        {/* Tab switcher */}
        {tab === "analytics" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Metric counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Bookings
                  </div>
                  <div className="text-2xl font-bold font-mono">{total}</div>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Pending
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-600">{pending}</div>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center gap-4">
                <div className="h-12 w-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Completed
                  </div>
                  <div className="text-2xl font-bold font-mono text-green-600">{completed}</div>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-500/10 text-primary rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Revenue (Est)
                  </div>
                  <div className="text-2xl font-bold font-mono text-gradient-rose">
                    ₹{estimatedRevenue}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Charts & Booking Log */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Chart */}
              <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
                <h3 className="font-bold text-base">Booking Frequency (Last 7 Days)</h3>
                <div className="h-64 w-full">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                      No schedule logs found to plot.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.78 0.09 30)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="oklch(0.78 0.09 30)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={10}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="Bookings"
                          stroke="oklch(0.78 0.09 30)"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorBook)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Booking logs summary */}
              <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-3">Status Breakdown</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending Approval:</span>
                      <span className="font-bold font-mono">{pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed Slots:</span>
                      <span className="font-bold font-mono">{confirmed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed Sessions:</span>
                      <span className="font-bold font-mono">{completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancelled / No Show:</span>
                      <span className="font-bold font-mono">{cancelled}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <button
                    onClick={() => setTab("appointments")}
                    className="w-full py-2.5 rounded-full bg-secondary hover:bg-accent text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                  >
                    Manage Appointments
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "appointments" && <AppointmentsManager />}
        {tab === "services" && <ServicesManager />}
        {tab === "gallery" && <GalleryManager />}
        {tab === "team" && <TeamManager />}
        {tab === "promotions" && <OffersManager />}
        {tab === "blog" && <BlogManager />}
        {tab === "faqs" && <FAQsManager />}
        {tab === "settings" && <SettingsManager />}
        {tab === "financials" && <FinancialsManager />}
        {tab === "location" && <LocationManager />}
      </main>
    </div>
  );
}
