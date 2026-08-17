import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { money } from "../money.js";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function OrdersTab() {
  const [from, setFrom] = useState(daysAgoStr(7));
  const [to, setTo] = useState(todayStr());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    // "to" incluye todo ese día hasta las 23:59:59
    const toEnd = new Date(to + "T23:59:59").toISOString();
    const fromStart = new Date(from + "T00:00:00").toISOString();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", fromStart)
      .lte("created_at", toEnd)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const count = orders.length;
    const revenue = orders.reduce((s, o) => s + Number(o.subtotal || 0), 0);
    const avg = count ? revenue / count : 0;
    return { count, revenue, avg };
  }, [orders]);

  const removeOrder = async (row) => {
    if (!confirm("¿Eliminar este pedido del historial?")) return;
    await supabase.from("orders").delete().eq("id", row.id);
    load();
  };

  const exportCsv = () => {
    const header = ["Fecha", "Cliente", "Celular", "Dirección", "Barrio", "Productos", "Subtotal"];
    const rows = orders.map((o) => [
      new Date(o.created_at).toLocaleString("es-CO"),
      o.customer_name || "",
      o.customer_phone || "",
      o.customer_address || "",
      o.customer_neighborhood || "",
      (o.items || []).map((i) => `${i.qty}x ${i.name}`).join(" | "),
      o.subtotal,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos_${from}_a_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="disp">Pedidos</h2>
      </div>

      <div className="admin-order-filters">
        <div>
          <label>Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary admin-btn-inline" onClick={load} disabled={loading}>
          {loading ? "Buscando…" : "Buscar"}
        </button>
        <button className="btn btn-secondary admin-btn-inline" onClick={exportCsv} disabled={orders.length === 0}>
          ⬇ Exportar CSV
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-report-cards">
        <div className="admin-report-card">
          <span>Pedidos</span>
          <b>{totals.count}</b>
        </div>
        <div className="admin-report-card">
          <span>Ingresos del período</span>
          <b>{money(totals.revenue)}</b>
        </div>
        <div className="admin-report-card">
          <span>Ticket promedio</span>
          <b>{money(totals.avg)}</b>
        </div>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">No hay pedidos en este rango de fechas.</p>
      ) : (
        <div className="admin-list">
          {orders.map((o) => (
            <div className="admin-order-row" key={o.id}>
              <div className="admin-order-main" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                <div>
                  <b>{o.customer_name || "(sin nombre)"}</b>
                  <span className="admin-order-date">{new Date(o.created_at).toLocaleString("es-CO")}</span>
                </div>
                <b className="disp admin-order-total">{money(o.subtotal)}</b>
              </div>
              {expanded === o.id && (
                <div className="admin-order-detail">
                  <p>
                    📱 {o.customer_phone} <br />
                    📍 {o.customer_address} {o.customer_neighborhood ? `· ${o.customer_neighborhood}` : ""}
                  </p>
                  <ul>
                    {(o.items || []).map((i, idx) => (
                      <li key={idx}>
                        {i.qty} × {i.name} — {money(i.price * i.qty)}
                      </li>
                    ))}
                  </ul>
                  <button className="admin-icon-btn danger" onClick={() => removeOrder(o)}>
                    Borrar pedido
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
