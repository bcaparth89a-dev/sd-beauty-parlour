import { useEffect, useState } from "react";
import { Splash } from "@/components/Splash";
import { AdminLogin } from "@/components/admin/Login";
import { AdminDashboard } from "@/components/admin/Dashboard";

export default function AdminPage() {
  const [splash, setSplash] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    document.title = "Admin — SD Beauty Parlour";
    if (typeof window !== "undefined" && sessionStorage.getItem("sd-admin") === "1")
      setAuthed(true);
  }, []);

  if (splash) return <Splash onDone={() => setSplash(false)} quote="Manage your beauty empire" />;
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return (
    <AdminDashboard
      onLogout={() => {
        sessionStorage.removeItem("sd-admin");
        setAuthed(false);
      }}
    />
  );
}
