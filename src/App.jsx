import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { money } from "./money";
import Banners from "./components/Banners.jsx";
import Recipes from "./components/Recipes.jsx";
import Footer from "./components/Footer.jsx";

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Overlay({ children, onClose, side }) {
  return (
    <div
      className={"overlay" + (side ? "" : " bottom")}
      onClick={(e) => {
        if (e.target.classList.contains("overlay")) onClose();
      }}
    >
      <div className={side ? "drawer" : "sheet"}>{children}</div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [settings, setSettings] = useState({});
  const [filter, setFilter] = useState("Todos");
  const [cart, setCart] = useState({});
  const [view, setView] = useState(null); // null | 'cart' | 'form' | 'confirm'
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [form, setForm] = useState({ nombre: "", celular: "", direccion: "", barrio: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [zoomProduct, setZoomProduct] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const catalogRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, p, r, s] = await Promise.all([
          supabase.from("banners").select("*").eq("active", true).order("sort_order"),
          supabase.from("products").select("*").eq("active", true).order("sort_order"),
          supabase.from("recipes").select("*").eq("active", true).order("sort_order"),
          supabase.from("settings").select("*"),
        ]);
        if (b.error || p.error || r.error || s.error) {
          throw b.error || p.error || r.error || s.error;
        }
        setBanners(b.data || []);
        setProducts(p.data || []);
        setRecipes(r.data || []);
        const settingsObj = {};
        (s.data || []).forEach((row) => (settingsObj[row.key] = row.value));
        setSettings(settingsObj);
      } catch (err) {
        console.error(err);
        setErrorMsg(
          "No pudimos cargar el catálogo. Revisa que las variables de Supabase (Secrets) estén configuradas y que hayas corrido supabase/schema.sql."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
    } else {
      setShowInstallHelp(true);
    }
  };

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Otros"));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const visibleProducts = useMemo(
    () => products.filter((p) => filter === "Todos" || (p.category || "Otros") === filter),
    [products, filter]
  );

  // Si alguien llega desde un link compartido (#producto=ID), abrimos ese producto directamente.
  useEffect(() => {
    if (products.length === 0) return;
    const match = window.location.hash.match(/producto=([^&]+)/);
    if (match) {
      const found = products.find((p) => p.id === match[1]);
      if (found && found.image_url) {
        setZoomProduct(found);
        scrollToCatalog();
      }
    }
  }, [products]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => {
        const p = products.find((pr) => pr.id === id);
        return p ? { ...p, qty: q } : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const pedidoMinimo = Number(settings.pedido_minimo) || 0;
  const belowMinimum = pedidoMinimo > 0 && subtotal > 0 && subtotal < pedidoMinimo;

  const setQty = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const cur = next[id] || 0;
      const nv = Math.max(0, cur + delta);
      if (nv === 0) delete next[id];
      else next[id] = nv;
      return next;
    });
  };

  const removeItem = (id) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateForm = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const requiredOk = form.nombre && form.celular && form.direccion;

  const buildMessage = () => {
    const lines = [];
    lines.push("🛒 *Nuevo pedido - Cali Carnes*");
    lines.push("");
    cartItems.forEach((i) => lines.push(`• ${i.qty} x ${i.name} — ${money(i.price * i.qty)}`));
    lines.push("");
    lines.push(`*Total: ${money(subtotal)}*`);
    lines.push("");
    lines.push("*Datos del cliente:*");
    lines.push(`Nombre: ${form.nombre}`);
    lines.push(`Celular: ${form.celular}`);
    lines.push(`Dirección: ${form.direccion}`);
    lines.push(`Barrio: ${form.barrio}`);
    return lines.join("\n");
  };

  const sendWhatsapp = async () => {
    try {
      await supabase.from("orders").insert({
        customer_name: form.nombre,
        customer_phone: form.celular,
        customer_address: form.direccion,
        customer_neighborhood: form.barrio,
        items: cartItems.map((i) => ({ name: i.name, price: i.price, qty: i.qty })),
        subtotal,
      });
    } catch (err) {
      console.error("No se pudo guardar el pedido:", err);
    }
    const num = (settings.whatsapp_cali || "").replace(/\D/g, "");
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  const closeAll = () => {
    setView(null);
    setConfirmChecked(false);
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const siteUrl = typeof window !== "undefined" ? window.location.origin + import.meta.env.BASE_URL : "";

  const productUrl = (product) => `${siteUrl}#producto=${product.id}`;

  const shareProduct = (product, network) => {
    const text = `${product.name} — ${money(product.price)} en Cali Carnes 🥩`;
    const link = productUrl(product);
    if (network === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + link)}`, "_blank");
    } else if (network === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,
        "_blank",
        "width=600,height=500"
      );
    }
  };

  if (loading) {
    return <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--muted)" }}>Cargando…</div>;
  }

  if (errorMsg) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
        <p>{errorMsg}</p>
      </div>
    );
  }

  return (
    <>
      <div className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Cali Carnes" className="brand-logo" />
            <span>Cali Carnes</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={scrollToCatalog}>
              Catálogo
            </button>
            {categories
              .filter((c) => c !== "Todos")
              .map((c) => (
                <button
                  key={c}
                  className="nav-link"
                  onClick={() => {
                    setFilter(c);
                    scrollToCatalog();
                  }}
                >
                  {c}
                </button>
              ))}
          </div>
          {!isStandalone && (
            <button className="nav-install" onClick={handleInstallClick} aria-label="Instalar app" title="Instalar app">
              ⬇ <span className="nav-install-label">Instalar app</span>
            </button>
          )}
          <button className="nav-cart" onClick={() => setView("cart")}>
            🛒 {totalQty > 0 && <span className="badge">{totalQty}</span>}
          </button>
        </div>
      </div>

      <Banners banners={banners} />

      <div className="intro-strip">
        <h1 className="disp">{settings.intro_title || "Carne fresca a domicilio"}</h1>
        <p>{settings.intro_subtitle || "Elige tus productos y confirma tu pedido por WhatsApp."}</p>
        <div className="trust-row">
          <div className="trust-chip">✓ Empacado al vacío</div>
          <div className="trust-chip">✓ Entrega el mismo día</div>
          <div className="trust-chip">✓ Frescura garantizada</div>
        </div>
      </div>

      <Recipes recipes={recipes} />

      <div className="section" ref={catalogRef}>
        <div className="section-head">
          <div>
            <h2 className="section-title disp">🥩 Catálogo</h2>
            <p className="section-sub">Selecciona tus productos favoritos</p>
          </div>
        </div>
        <div className="filters">
          {categories.map((c) => (
            <button key={c} className={"chip" + (filter === c ? " active" : "")} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="empty">No hay productos en esta categoría todavía.</div>
        ) : (
          <div className="grid">
            {visibleProducts.map((p) => {
              const qty = cart[p.id] || 0;
              return (
                <div className="card" key={p.id}>
                  <div
                    className="card-img zoomable"
                    style={p.image_url ? { backgroundImage: `url(${p.image_url})` } : {}}
                    onClick={() => p.image_url && setZoomProduct(p)}
                  >
                    {!p.image_url && "🍽️"}
                    <span className="fresh">Fresco</span>
                    {p.image_url && <span className="zoom-hint">🔍</span>}
                  </div>
                  <div className="card-body">
                    <span className="card-cat">{p.category || "Otros"}</span>
                    <div className="card-name">{p.name}</div>
                    <div className="card-desc">{p.description}</div>
                    <span className="price disp">{money(p.price)}</span>
                    <div className="card-foot">
                      <button className="addbtn" onClick={() => setQty(p.id, 1)}>
                        🛒 Agregar al carrito{qty > 0 ? ` (${qty})` : ""}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer settings={settings} />

      {totalQty > 0 && !view && (
        <div className="floatbar" onClick={() => setView("cart")}>
          <div>
            <strong className="disp">{money(subtotal)}</strong>
            <small>
              {totalQty} producto{totalQty > 1 ? "s" : ""}
            </small>
          </div>
          <div>Ver pedido →</div>
        </div>
      )}

      {view === "cart" && (
        <Overlay onClose={closeAll} side>
          <div className="drawer-head">
            <h2 className="disp">Tu pedido</h2>
            <button className="closebtn" onClick={closeAll}>
              ×
            </button>
          </div>
          {cartItems.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Todavía no has agregado productos.</p>
          ) : (
            cartItems.map((i) => (
              <div className="cartline" key={i.id}>
                <div className="thumb" style={i.image_url ? { backgroundImage: `url(${i.image_url})` } : {}}></div>
                <div className="info">
                  <b>{i.name}</b>
                  <span>{money(i.price)} c/u</span>
                </div>
                <div className="qtybox">
                  <button onClick={() => setQty(i.id, -1)}>–</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, 1)}>+</button>
                </div>
                <button className="removeitem" onClick={() => removeItem(i.id)} aria-label={`Quitar ${i.name}`}>
                  ×
                </button>
              </div>
            ))
          )}
          <div className="total-row grand">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </div>
          {belowMinimum && (
            <div className="min-order-warn">
              El pedido mínimo es {money(pedidoMinimo)}. Te faltan {money(pedidoMinimo - subtotal)} para continuar.
            </div>
          )}
          <button
            className="btn btn-primary"
            disabled={cartItems.length === 0 || belowMinimum}
            onClick={() => setView("form")}
          >
            Continuar con mis datos
          </button>
          <button className="btn btn-secondary" onClick={closeAll}>
            Seguir comprando
          </button>
        </Overlay>
      )}

      {view === "form" && (
        <Overlay onClose={() => setView("cart")}>
          <div className="sheet-head">
            <h2 className="disp">Tus datos</h2>
            <button className="closebtn" onClick={closeAll}>
              ×
            </button>
          </div>
          <Field label="Nombre *">
            <input value={form.nombre} onChange={(e) => updateForm("nombre", e.target.value)} />
          </Field>
          <Field label="Celular *">
            <input value={form.celular} onChange={(e) => updateForm("celular", e.target.value)} />
          </Field>
          <Field label="Dirección *">
            <input value={form.direccion} onChange={(e) => updateForm("direccion", e.target.value)} />
          </Field>
          <Field label="Barrio">
            <input value={form.barrio} onChange={(e) => updateForm("barrio", e.target.value)} />
          </Field>
          <div className="total-row grand">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </div>
          <button className="btn btn-primary" disabled={!requiredOk} onClick={() => setView("confirm")}>
            Revisar pedido
          </button>
          <button className="btn btn-secondary" onClick={() => setView("cart")}>
            ← Corregir
          </button>
        </Overlay>
      )}

      {view === "confirm" && (
        <Overlay onClose={() => setView("form")}>
          <div className="sheet-head">
            <h2 className="disp">Confirmar pedido</h2>
            <button className="closebtn" onClick={closeAll}>
              ×
            </button>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 12.5,
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: 12,
              lineHeight: 1.6,
            }}
          >
            {buildMessage()}
          </pre>
          <label className="check-row">
            <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
            <span>Confirmo que los datos del pedido son correctos.</span>
          </label>
          <button className="btn btn-wa" disabled={!confirmChecked} onClick={sendWhatsapp}>
            📲 Confirmar y enviar por WhatsApp
          </button>
          <button className="btn btn-secondary" onClick={() => setView("form")}>
            ← Corregir
          </button>
        </Overlay>
      )}

      {zoomProduct && (
        <div className="zoom-overlay" onClick={(e) => e.target === e.currentTarget && setZoomProduct(null)}>
          <button className="zoom-close" onClick={() => setZoomProduct(null)} aria-label="Cerrar">
            ×
          </button>
          <div className="zoom-box">
            <img src={zoomProduct.image_url} alt={zoomProduct.name} />
            <div className="zoom-info">
              <div>
                <b className="disp">{zoomProduct.name}</b>
                <span className="price disp">{money(zoomProduct.price)}</span>
              </div>
              <div className="zoom-share">
                <span>Compartir:</span>
                <button className="share-btn wa" onClick={() => shareProduct(zoomProduct, "whatsapp")} aria-label="Compartir por WhatsApp">
                  🟢 WhatsApp
                </button>
                <button className="share-btn fb" onClick={() => shareProduct(zoomProduct, "facebook")} aria-label="Compartir en Facebook">
                  🔵 Facebook
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setQty(zoomProduct.id, 1);
                  setZoomProduct(null);
                }}
              >
                🛒 Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstallHelp && (
        <Overlay onClose={() => setShowInstallHelp(false)}>
          <div className="sheet-head">
            <h2 className="disp">Instalar la app</h2>
            <button className="closebtn" onClick={() => setShowInstallHelp(false)}>
              ×
            </button>
          </div>
          {isIos ? (
            <div className="install-steps">
              <p>En tu iPhone/iPad, con Safari:</p>
              <ol>
                <li>
                  Toca el botón compartir <b>􀈂</b> (el cuadrado con la flecha hacia arriba), abajo en la barra del navegador.
                </li>
                <li>
                  Baja y elige <b>"Agregar a inicio"</b> (Add to Home Screen).
                </li>
                <li>Confirma tocando "Agregar" arriba a la derecha.</li>
              </ol>
            </div>
          ) : (
            <div className="install-steps">
              <p>En Chrome / Edge (computador o Android):</p>
              <ol>
                <li>
                  Busca el ícono de instalar <b>⊕</b> o <b>⋮</b> en la barra de direcciones / menú del navegador.
                </li>
                <li>
                  Elige <b>"Instalar app"</b> o <b>"Instalar Cali Carnes"</b>.
                </li>
              </ol>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setShowInstallHelp(false)}>
            Entendido
          </button>
        </Overlay>
      )}
    </>
  );
}
