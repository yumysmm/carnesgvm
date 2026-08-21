import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductsTab from "./ProductsTab.jsx";
import BannersTab from "./BannersTab.jsx";
import RecipesTab from "./RecipesTab.jsx";
import SettingsTab from "./SettingsTab.jsx";
import OrdersTab from "./OrdersTab.jsx";
import VisitsTab from "./VisitsTab.jsx";

function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    onLoggedIn();
  };

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <h1 className="disp">Panel administrativo</h1>
        <p>Inicia sesión con el correo y contraseña que creaste en Supabase.</p>
        <label>Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="admin-error">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <a className="admin-back" href="./">
          ← Volver a la tienda
        </a>
      </form>
    </div>
  );
}

const TABS = [
  { id: "orders", label: "🧾 Pedidos" },
  { id: "visits", label: "📊 Visitas" },
  { id: "products", label: "🥩 Productos" },
  { id: "banners", label: "🖼️ Banners" },
  { id: "recipes", label: "🎥 Recetas" },
  { id: "settings", label: "⚙️ Ajustes" },
];

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="admin-loading">Cargando…</div>;
  }

  if (!session) {
    return <LoginForm onLoggedIn={() => {}} />;
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <span className="disp">Panel administrativo · Cali Carnes</span>
        <div className="admin-topbar-right">
          <a href="./" target="_blank" rel="noreferrer">
            Ver tienda ↗
          </a>
          <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={"admin-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === "orders" && <OrdersTab />}
        {tab === "visits" && <VisitsTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "banners" && <BannersTab />}
        {tab === "recipes" && <RecipesTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
