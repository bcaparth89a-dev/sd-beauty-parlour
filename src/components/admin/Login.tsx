import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    setTimeout(() => {
      if (
        email === import.meta.env.VITE_ADMIN_EMAIL &&
        password === import.meta.env.VITE_ADMIN_PASSWORD
      ) {
        sessionStorage.setItem("sd-admin", "1");
        onLogin();
      } else {
        setErr("Invalid email or password");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-soft"
      >
        <div className="text-center mb-6">
          <img src={logo} alt="" className="h-20 w-20 mx-auto" />
          <h1 className="text-2xl font-bold mt-3">Admin Login</h1>
          <p className="text-sm text-muted-foreground">SD Beauty Parlour</p>
        </div>
        <label className="block mb-3">
          <span className="text-sm font-medium block mb-1.5">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-input"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium block mb-1.5">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-input"
          />
        </label>
        {err && <p className="text-sm text-destructive mb-3">{err}</p>}
        <button
          disabled={loading}
          className="w-full py-3 rounded-full gradient-rose text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Sign In
        </button>
      </form>
    </div>
  );
}
