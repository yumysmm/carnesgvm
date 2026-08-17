import { useEffect, useRef, useState } from "react";

export default function Banners({ banners }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const go = (i) => {
    clearInterval(timerRef.current);
    setIndex((i + banners.length) % banners.length);
  };

  return (
    <div className="hero">
      <div className="hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((b) => {
          const slide = (
            <div className="hero-slide" key={b.id}>
              <img src={b.image_url} alt={b.title || ""} loading="lazy" />
              {(b.title || b.subtitle) && (
                <div className="caption">
                  {b.title && <h2>{b.title}</h2>}
                  {b.subtitle && <p>{b.subtitle}</p>}
                </div>
              )}
            </div>
          );
          return b.link_url ? (
            <a href={b.link_url} target="_blank" rel="noreferrer" key={b.id} style={{ flex: "0 0 100%" }}>
              {slide}
            </a>
          ) : (
            slide
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button className="hero-arrow left" onClick={() => go(index - 1)} aria-label="Anterior">
            ‹
          </button>
          <button className="hero-arrow right" onClick={() => go(index + 1)} aria-label="Siguiente">
            ›
          </button>
          <div className="hero-dots">
            {banners.map((b, i) => (
              <button key={b.id} className={i === index ? "active" : ""} onClick={() => go(i)} aria-label={`Ir al banner ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
