import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function VisitsTab() {
  const [from, setFrom] = useState(daysAgoStr(29));
  const [to, setTo] = useState(todayStr());
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const toEnd = new Date(to + "T23:59:59").toISOString();
    const fromStart = new Date(from + "T00:00:00").toISOString();
    const { data, error } = await supabase
      .from("visits")
      .select("created_at")
      .gte("created_at", fromStart)
      .lte("created_at", toEnd)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setVisits(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayCount = useMemo(() => {
    const today = todayStr();
    return visits.filter((v) => v.created_at.slice(0, 10) === today).length;
  }, [visits]);

  const byDay = useMemo(() => {
    const map = {};
    visits.forEach((v) => {
      const day = v.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [visits]);

  const maxDay = useMemo(() => byDay.reduce((m, [, c]) => Math.max(m, c), 1), [byDay]);

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="disp">Visitas a la página</h2>
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
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-report-cards">
        <div className="admin-report-card">
          <span>Visitas hoy</span>
          <b>{todayCount}</b>
        </div>
        <div className="admin-report-card">
          <span>Visitas en el período</span>
          <b>{visits.length}</b>
        </div>
        <div className="admin-report-card">
          <span>Promedio diario</span>
          <b>{byDay.length ? Math.round(visits.length / byDay.length) : 0}</b>
        </div>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : byDay.length === 0 ? (
        <p className="admin-empty">No hay visitas registradas en este rango de fechas.</p>
      ) : (
        <div className="admin-visits-chart">
          {byDay.map(([day, count]) => (
            <div className="admin-visits-row" key={day}>
              <span className="admin-visits-date">{day}</span>
              <div className="admin-visits-bar-track">
                <div className="admin-visits-bar" style={{ width: `${(count / maxDay) * 100}%` }} />
              </div>
              <span className="admin-visits-count">{count}</span>
            </div>
          ))}
        </div>
      )}

      <p className="admin-hint" style={{ marginTop: 16 }}>
        Se cuenta 1 visita por cada persona que abre la tienda (una vez por sesión de navegador, aunque recargue la
        página varias veces).
      </p>
    </div>
  );
}
