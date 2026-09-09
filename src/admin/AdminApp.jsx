import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductsTab from "./ProductsTab.jsx";
import BannersTab from "./BannersTab.jsx";
import RecipesTab from "./RecipesTab.jsx";
import SettingsTab from "./SettingsTab.jsx";
import OrdersTab from "./OrdersTab.jsx";
import VisitsTab from "./VisitsTab.jsx";
import VendorsTab from "./VendorsTab.jsx";

function LoginForm() {
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
    if (error) setError("Correo o contraseña incorrectos.");
  };

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <h1 className="disp">Panel administrativo</h1>
        <p>Inicia sesión con tu correo y contraseña.</p>
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

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  const [myVendorRow, setMyVendorRow] = useState(undefined); // undefined = cargando
  const [vendorsList, setVendorsList] = useState([]);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: mine } = await supabase
        .from("vendors")
        .select("*")
        .eq("owner_user_id", session.user.id)
        .maybeSingle();
      setMyVendorRow(mine || null);

      const { data: all } = await supabase.from("vendors").select("*").order("name");
      setVendorsList(all || []);
    })();
  }, [session]);

  if (session === undefined || (session && myVendorRow === undefined)) {
    return <div className="admin-loading">Cargando…</div>;
  }

  if (!session) {
    return <LoginForm />;
  }

  // Si no existe ninguna fila en "vendors" todavía, tratamos a quien entra como dueño
  // (paso de transición antes de correr la migración multivendedor).
  const noVendorsConfigured = vendorsList.length === 0;
  const isOwner = noVendorsConfigured || (myVendorRow && myVendorRow.is_owner);
  const myVendorId = myVendorRow ? myVendorRow.id : null;

  const TABS = isOwner
    ? [
        { id: "orders", label: "🧾 Pedidos" },
        { id: "visits", label: "📊 Visitas" },
        { id: "products", label: "🥩 Productos" },
        { id: "banners", label: "🖼️ Banners" },
        { id: "recipes", label: "🎥 Recetas" },
        { id: "vendors", label: "👥 Vendedores" },
        { id: "settings", label: "⚙️ Ajustes" },
      ]
    : [
        { id: "orders", label: "🧾 Mis pedidos" },
        { id: "products", label: "🥩 Mis productos" },
      ];

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <span className="disp">
          Panel administrativo · Cali Carnes{!isOwner && myVendorRow ? ` — ${myVendorRow.name}` : ""}
        </span>
        <div className="admin-topbar-right">
          <a href="./" target="_blank" rel="noreferrer">
            Ver tienda ↗
          </a>
          <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </div>

      {!isOwner && !myVendorRow && (
        <div className="admin-content">
          <p className="admin-error">
            Tu usuario inició sesión pero no está vinculado a ningún vendedor. Pídele al dueño que te agregue desde la
            pestaña "Vendedores".
          </p>
        </div>
      )}

      {noVendorsConfigured && (
        <div className="admin-content" style={{ paddingBottom: 0 }}>
          <p className="admin-hint">
            ⚠️ Todavía no has corrido la migración multivendedor (supabase/multivendor.sql) ni te has registrado como
            dueño. Por ahora tienes acceso completo, pero hazlo pronto para que el sistema de vendedores quede
            protegido correctamente.
          </p>
        </div>
      )}

      {(isOwner || myVendorRow) && (
        <>
          <div className="admin-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={"admin-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="admin-content">
            {tab === "orders" && <OrdersTab isOwner={isOwner} myVendorId={myVendorId} vendorsList={vendorsList} />}
            {tab === "visits" && isOwner && <VisitsTab />}
            {tab === "products" && (
              <ProductsTab isOwner={isOwner} myVendorId={myVendorId} vendorsList={vendorsList} />
            )}
            {tab === "banners" && isOwner && <BannersTab />}
            {tab === "recipes" && isOwner && <RecipesTab />}
            {tab === "vendors" && isOwner && <VendorsTab />}
            {tab === "settings" && isOwner && <SettingsTab />}
          </div>
        </>
      )}
    </div>
  );
}
