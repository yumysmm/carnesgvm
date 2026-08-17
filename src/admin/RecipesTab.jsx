import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { uploadMedia } from "./uploadMedia.js";

const EMPTY = { title: "", video_url: "", thumbnail_url: "", description: "", sort_order: 0, active: true };

export default function RecipesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("recipes").select("*").order("sort_order");
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (row) => {
    await supabase.from("recipes").update({ active: !row.active }).eq("id", row.id);
    load();
  };

  const remove = async (row) => {
    if (!confirm(`¿Eliminar "${row.title}"?`)) return;
    await supabase.from("recipes").delete().eq("id", row.id);
    load();
  };

  const startNew = () => setEditing({ ...EMPTY });
  const startEdit = (row) => setEditing({ ...row });

  const handleVideoFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadMedia(file, "recipes");
      setEditing((prev) => ({ ...prev, video_url: url }));
    } catch (err) {
      setError("No se pudo subir el video: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing.title || !editing.video_url) {
      setError("Título y video son obligatorios.");
      return;
    }
    setError("");
    const payload = {
      title: editing.title,
      video_url: editing.video_url,
      thumbnail_url: editing.thumbnail_url,
      description: editing.description,
      sort_order: Number(editing.sort_order) || 0,
      active: editing.active,
    };
    if (editing.id) {
      await supabase.from("recipes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("recipes").insert(payload);
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="disp">Recetas y videos</h2>
        <button className="btn btn-primary admin-btn-inline" onClick={startNew}>
          + Nueva receta
        </button>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="admin-list">
          {items.map((row) => (
            <div className="admin-row" key={row.id}>
              <div className="admin-row-info">
                <b>{row.title}</b>
                <span>{row.video_url}</span>
              </div>
              <span className={"admin-status" + (row.active ? " on" : "")}>{row.active ? "Activo" : "Oculto"}</span>
              <button className="admin-icon-btn" onClick={() => toggleActive(row)}>
                {row.active ? "Ocultar" : "Mostrar"}
              </button>
              <button className="admin-icon-btn" onClick={() => startEdit(row)}>
                Editar
              </button>
              <button className="admin-icon-btn danger" onClick={() => remove(row)}>
                Borrar
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="admin-empty">Todavía no hay recetas.</p>}
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="admin-modal">
            <h3 className="disp">{editing.id ? "Editar receta" : "Nueva receta"}</h3>
            {error && <p className="admin-error">{error}</p>}

            <label>Título *</label>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

            <label>Link de YouTube</label>
            <input
              value={editing.video_url && editing.video_url.startsWith("http") && !editing.video_url.includes("supabase") ? editing.video_url : ""}
              onChange={(e) => setEditing({ ...editing, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=…"
            />
            <p className="admin-hint">O, si prefieres, sube tu propio archivo de video (.mp4):</p>
            <input type="file" accept="video/*" onChange={handleVideoFile} disabled={uploading} />
            {uploading && <p className="admin-hint">Subiendo video…</p>}
            {editing.video_url && <p className="admin-hint">Video actual: {editing.video_url}</p>}

            <label>Descripción corta</label>
            <input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

            <label>Orden (menor número aparece primero)</label>
            <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />

            <label className="admin-checkbox-row">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Visible en la tienda
            </label>

            <div className="admin-modal-actions">
              <button className="btn btn-primary" onClick={save} disabled={uploading}>
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
