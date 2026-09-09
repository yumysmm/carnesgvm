import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { uploadMedia } from "./uploadMedia.js";
import { money } from "../money.js";

const PAGE_SIZE = 20;

function GeneralProductsPicker({ myVendorId }) {
  const [general, setGeneral] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [g, s] = await Promise.all([
      supabase.from("products").select("*").is("vendor_id", null).eq("active", true).order("sort_order"),
      supabase.from("vendor_selected_products").select("product_id").eq("vendor_id", myVendorId),
    ]);
    if (g.error) setError(g.error.message);
    setGeneral(g.data || []);
    setSelectedIds(new Set((s.data || []).map((r) => r.product_id)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (productId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(productId);
      else next.delete(productId);
      return next;
    });
    if (checked) {
      const { error } = await supabase.from("vendor_selected_products").insert({ vendor_id: myVendorId, product_id: productId });
      if (error) setError("No se pudo activar: " + error.message);
    } else {
      const { error } = await supabase
        .from("vendor_selected_products")
        .delete()
        .eq("vendor_id", myVendorId)
        .eq("product_id", productId);
      if (error) setError("No se pudo desactivar: " + error.message);
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div>
      {error && <p className="admin-error">{error}</p>}
      <p className="admin-hint">
        Estos son los productos generales de la empresa. Marca los que quieras mostrar también en tu propia tienda
        (se ven con la misma foto, precio y descripción que la tienda principal).
      </p>
      <div className="admin-list">
        {general.map((row) => (
          <div className="admin-row" key={row.id}>
            <div className="admin-row-thumb" style={row.image_url ? { backgroundImage: `url(${row.image_url})` } : {}} />
            <div className="admin-row-info">
              <b>{row.name}</b>
              <span>
                {money(row.price)} · {row.category || "General"}
              </span>
            </div>
            <label className="admin-checkbox-row" style={{ marginTop: 0 }}>
              <input
                type="checkbox"
                checked={selectedIds.has(row.id)}
                onChange={(e) => toggle(row.id, e.target.checked)}
              />
              Mostrar en mi tienda
            </label>
          </div>
        ))}
        {general.length === 0 && <p className="admin-empty">Todavía no hay productos generales disponibles.</p>}
      </div>
    </div>
  );
}

export default function ProductsTab({ isOwner, myVendorId, vendorsList }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // objeto en edición, o null
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const EMPTY = {
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    sort_order: 0,
    active: true,
    vendor_id: isOwner ? "" : myVendorId,
  };

  const load = async () => {
    setLoading(true);
    let query = supabase.from("products").select("*").order("sort_order");
    query = isOwner ? query : query.eq("vendor_id", myVendorId);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const vendorName = (vendorId) => {
    if (!vendorId) return "General (empresa)";
    const v = vendorsList.find((x) => x.id === vendorId);
    return v ? v.name : "—";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) => row.name?.toLowerCase().includes(q) || (row.category || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleActive = async (row) => {
    const { error } = await supabase.from("products").update({ active: !row.active }).eq("id", row.id);
    if (error) setError("No se pudo actualizar: " + error.message);
    load();
  };

  const remove = async (row) => {
    if (!confirm(`¿Eliminar "${row.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", row.id);
    if (error) setError("No se pudo borrar: " + error.message);
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
      vendor_id: isOwner ? editing.vendor_id || null : myVendorId,
    };
    if (editing.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) {
        setError("No se pudo guardar: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        setError("No se pudo guardar: " + error.message);
        return;
      }
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      {!isOwner && (
        <>
          <div className="admin-section-head">
            <h2 className="disp">Productos de la tienda principal</h2>
          </div>
          <GeneralProductsPicker myVendorId={myVendorId} />
          <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "28px 0" }} />
        </>
      )}

      <div className="admin-section-head">
        <h2 className="disp">{isOwner ? "Productos" : "Mis productos propios"}</h2>
        <button className="btn btn-primary admin-btn-inline" onClick={startNew}>
          + Nuevo producto
        </button>
      </div>

      {error && !editing && <p className="admin-error">{error}</p>}

      <div className="admin-search-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="🔍 Buscar por nombre o categoría…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <span className="admin-search-count">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="admin-list">
            {pageItems.map((row) => (
              <div className="admin-row" key={row.id}>
                <div className="admin-row-thumb" style={row.image_url ? { backgroundImage: `url(${row.image_url})` } : {}} />
                <div className="admin-row-info">
                  <b>{row.name}</b>
                  <span>
                    {money(row.price)} · {row.category || "General"}
                    {isOwner ? ` · ${vendorName(row.vendor_id)}` : ""}
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
            {filtered.length === 0 && (
              <p className="admin-empty">
                {search
                  ? "No hay productos que coincidan con tu búsqueda."
                  : isOwner
                  ? "Todavía no hay productos."
                  : "Todavía no has creado productos propios (esto no incluye los generales que elijas arriba)."}
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="admin-icon-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button className="admin-icon-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente →
              </button>
            </div>
          )}
        </>
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

            {isOwner && (
              <>
                <label>Vendedor (dueño del producto)</label>
                <select
                  value={editing.vendor_id || ""}
                  onChange={(e) => setEditing({ ...editing, vendor_id: e.target.value || null })}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: 10, fontSize: 14 }}
                >
                  <option value="">General (empresa)</option>
                  {vendorsList
                    .filter((v) => !v.is_owner)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </>
            )}

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
