import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { uploadMedia } from "./uploadMedia.js";
import { money } from "../money.js";

const EMPTY = { name: "", description: "", price: "", category: "", image_url: "", sort_order: 0, active: true };

export default function ProductsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // objeto en edición, o null
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("sort_order");
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (row) => {
    await supabase.from("products").update({ active: !row.active }).eq("id", row.id);
    load();
  };

  const remove = async (row) => {
    if (!confirm(`¿Eliminar "${row.name}"?`)) return;
    await supabase.from("products").delete().eq("id", row.id);
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
      const url = await uploadMedia(file, "products");
      setEditing((prev) => ({ ...prev, image_url: url }));
    } catch (err) {
      setError("No se pudo subir la imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing.name || !editing.price) {
      setError("Nombre y precio son obligatorios.");
      return;
    }
    setError("");
    const payload = {
      name: editing.name,
      description: editing.description,
      price: Number(editing.price),
      category: editing.category || "General",
      image_url: editing.image_url,
      sort_order: Number(editing.sort_order) || 0,
      active: editing.active,
    };
    if (editing.id) {
      await supabase.from("products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("products").insert(payload);
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="disp">Productos</h2>
        <button className="btn btn-primary admin-btn-inline" onClick={startNew}>
          + Nuevo producto
        </button>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="admin-list">
          {items.map((row) => (
            <div className="admin-row" key={row.id}>
              <div className="admin-row-thumb" style={row.image_url ? { backgroundImage: `url(${row.image_url})` } : {}} />
              <div className="admin-row-info">
                <b>{row.name}</b>
                <span>
                  {money(row.price)} · {row.category || "General"}
                </span>
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
          {items.length === 0 && <p className="admin-empty">Todavía no hay productos.</p>}
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="admin-modal">
            <h3 className="disp">{editing.id ? "Editar producto" : "Nuevo producto"}</h3>
            {error && <p className="admin-error">{error}</p>}

            <label>Nombre *</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />

            <label>Descripción</label>
            <input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

            <div className="admin-form-row">
              <div>
                <label>Precio *</label>
                <input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </div>
              <div>
                <label>Categoría</label>
                <input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Res, Pollo, Cerdo…" />
              </div>
            </div>

            <label>Foto del producto</label>
            <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
            {uploading && <p className="admin-hint">Subiendo imagen…</p>}
            {editing.image_url && <img src={editing.image_url} alt="" className="admin-preview" />}

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
