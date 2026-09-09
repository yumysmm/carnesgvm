import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const EMPTY = { slug: "", name: "", whatsapp: "", owner_user_id: "", active: true };

export default function VendorsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vendors").select("*").order("created_at");
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => setEditing({ ...EMPTY });
  const startEdit = (row) => setEditing({ ...row });

  const toggleActive = async (row) => {
    const { error } = await supabase.from("vendors").update({ active: !row.active }).eq("id", row.id);
    if (error) setError("No se pudo actualizar: " + error.message);
    load();
  };

  const remove = async (row) => {
    if (!confirm(`¿Eliminar al vendedor "${row.name}"? Sus productos y pedidos quedarán sin vendedor asignado.`)) return;
    const { error } = await supabase.from("vendors").delete().eq("id", row.id);
    if (error) setError("No se pudo borrar: " + error.message);
    load();
  };

  const save = async () => {
    if (!editing.slug || !editing.name || !editing.owner_user_id) {
      setError("Slug, nombre y UUID de usuario son obligatorios.");
      return;
    }
    setError("");
    const payload = {
      slug: editing.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      name: editing.name,
      whatsapp: editing.whatsapp || null,
      owner_user_id: editing.owner_user_id.trim(),
      active: editing.active,
    };
    const { error } = editing.id
      ? await supabase.from("vendors").update(payload).eq("id", editing.id)
      : await supabase.from("vendors").insert(payload);
    if (error) {
      setError("No se pudo guardar: " + error.message);
      return;
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="disp">Vendedores</h2>
        <button className="btn btn-primary admin-btn-inline" onClick={startNew}>
          + Nuevo vendedor
        </button>
      </div>

      {error && !editing && <p className="admin-error">{error}</p>}

      <div className="admin-spec-box">
        <b>Cómo agregar un vendedor</b>
        <ul>
          <li>Primero créale una cuenta en Supabase → Authentication → Users → Add user (correo + contraseña)</li>
          <li>Copia el UUID de ese usuario (columna "UID" en la lista de usuarios)</li>
          <li>Vuelve aquí y crea el vendedor pegando ese UUID, un "slug" corto (ej. "juan") y su nombre</li>
          <li>El link de su tienda queda: tu-sitio.com/?vendedor=juan</li>
        </ul>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="admin-list">
          {items.map((row) => (
            <div className="admin-row" key={row.id}>
              <div className="admin-row-info">
                <b>
                  {row.name} {row.is_owner && "👑"}
                </b>
                <span>/?vendedor={row.slug}</span>
              </div>
              <span className={"admin-status" + (row.active ? " on" : "")}>{row.active ? "Activo" : "Inactivo"}</span>
              {!row.is_owner && (
                <>
                  <button className="admin-icon-btn" onClick={() => toggleActive(row)}>
                    {row.active ? "Desactivar" : "Activar"}
                  </button>
                  <button className="admin-icon-btn" onClick={() => startEdit(row)}>
                    Editar
                  </button>
                  <button className="admin-icon-btn danger" onClick={() => remove(row)}>
                    Borrar
                  </button>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && <p className="admin-empty">Todavía no hay vendedores registrados.</p>}
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="admin-modal">
            <h3 className="disp">{editing.id ? "Editar vendedor" : "Nuevo vendedor"}</h3>
            {error && <p className="admin-error">{error}</p>}

            <label>Nombre *</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Juan Pérez" />

            <label>Slug para su link *</label>
            <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="juan" />
            <p className="admin-hint">Su tienda quedará en: tu-sitio.com/?vendedor={editing.slug || "juan"}</p>

            <label>WhatsApp propio (opcional, si no lo dejas usa el general)</label>
            <input value={editing.whatsapp || ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} placeholder="573001234567" />

            <label>UUID del usuario en Supabase (Authentication → Users) *</label>
            <input
              value={editing.owner_user_id}
              onChange={(e) => setEditing({ ...editing, owner_user_id: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />

            <label className="admin-checkbox-row">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Activo
            </label>

            <div className="admin-modal-actions">
              <button className="btn btn-primary" onClick={save}>
                Guardar
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
