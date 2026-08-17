import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { uploadMedia } from "./uploadMedia.js";

const EMPTY = { image_url: "", title: "", subtitle: "", link_url: "", sort_order: 0, active: true };

export default function BannersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("banners").select("*").order("sort_order");
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (row) => {
    await supabase.from("banners").update({ active: !row.active }).eq("id", row.id);
    load();
  };

  const remove = async (row) => {
    if (!confirm("¿Eliminar este banner?")) return;
    await supabase.from("banners").delete().eq("id", row.id);
    load();
  };

  const startNew = () => setEditing({ ...EMPTY });
  const startEdit = (row) => setEditing({ ...row });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadMedia(file, "banners");
      setEditing((prev) => ({ ...prev, image_url: url }));
    } catch (err) {
      setError("No se pudo subir la imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing.image_url) {
      setError("Sube una imagen para el banner.");
      return;
    }
    setError("");
    const payload = {
      image_url: editing.image_url,
      title: editing.title,
      subtitle: editing.subtitle,
      link_url: editing.link_url,
      sort_order: Number(editing.sort_order) || 0,
      active: editing.active,
    };
    if (editing.id) {
      await supabase.from("banners").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("banners").insert(payload);
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="disp">Banners</h2>
        <button className="btn btn-primary admin-btn-inline" onClick={startNew}>
          + Nuevo banner
        </button>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="admin-list">
          {items.map((row) => (
            <div className="admin-row" key={row.id}>
              <div className="admin-row-thumb wide" style={{ backgroundImage: `url(${row.image_url})` }} />
              <div className="admin-row-info">
                <b>{row.title || "(sin título)"}</b>
                <span>{row.subtitle}</span>
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
          {items.length === 0 && <p className="admin-empty">Todavía no hay banners.</p>}
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="admin-modal">
            <h3 className="disp">{editing.id ? "Editar banner" : "Nuevo banner"}</h3>
            {error && <p className="admin-error">{error}</p>}

            <div className="admin-spec-box">
              <b>📐 Medida recomendada: 1600 × 700 px</b>
              <ul>
                <li>Peso máximo 500 KB (ideal 200–300 KB) en JPG o WEBP</li>
                <li>Deja el 15–20% inferior de la foto libre de texto/logo: ahí se sobrepone el título</li>
                <li>Centra el elemento principal (producto, cara, logo): en celular se recorta más por los lados</li>
              </ul>
            </div>

            <label>Imagen del banner *</label>
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
            {uploading && <p className="admin-hint">Subiendo imagen…</p>}
            {editing.image_url && <img src={editing.image_url} alt="" className="admin-preview wide" />}

            <label>Título (opcional, aparece sobre la imagen)</label>
            <input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

            <label>Subtítulo (opcional)</label>
            <input value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />

            <label>Enlace al hacer clic (opcional)</label>
            <input value={editing.link_url || ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://…" />

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
