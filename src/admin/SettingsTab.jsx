import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const KEYS = [
  { key: "whatsapp_cali", label: "WhatsApp para pedidos (57 + celular, 10 dígitos)" },
  { key: "intro_title", label: "Título principal de la tienda" },
  { key: "intro_subtitle", label: "Subtítulo / frase debajo del título" },
  { key: "pedido_minimo", label: "Pedido mínimo en $ (deja vacío o 0 para no exigir mínimo)" },
];

export default function SettingsTab() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) setError(error.message);
      const obj = {};
      (data || []).forEach((row) => (obj[row.key] = row.value));
      setValues(obj);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    for (const { key } of KEYS) {
      const { error } = await supabase.from("settings").upsert({ key, value: values[key] || "" });
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setSavedMsg("Ajustes guardados ✓");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="admin-settings">
      <h2 className="disp">Ajustes generales</h2>
      {error && <p className="admin-error">{error}</p>}
      {KEYS.map(({ key, label }) => (
        <div key={key}>
          <label>{label}</label>
          <input
            value={values[key] || ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}
      <button className="btn btn-primary admin-btn-inline" onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar ajustes"}
      </button>
      {savedMsg && <span className="admin-saved">{savedMsg}</span>}
    </div>
  );
}
