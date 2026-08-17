function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/shorts/")) {
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      }
    }
  } catch (e) {
    /* not a valid URL */
  }
  return null;
}

export default function Recipes({ recipes }) {
  if (!recipes || recipes.length === 0) return null;
  return (
    <div className="section">
      <div className="section-head">
        <div>
          <h2 className="section-title disp">🎥 Recetas y tips</h2>
          <p className="section-sub">Aprovecha al máximo cada corte</p>
        </div>
      </div>
      <div className="recipe-row">
        {recipes.map((r) => {
          const embed = toEmbedUrl(r.video_url);
          return (
            <div className="recipe-card" key={r.id}>
              <div className="frame">
                {embed ? (
                  <iframe
                    src={embed}
                    title={r.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={r.video_url} poster={r.thumbnail_url} controls preload="metadata" />
                )}
              </div>
              <div className="rbody">
                <b>{r.title}</b>
                {r.description && <span>{r.description}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
