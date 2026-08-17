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
    /* not a valid URL, fall through */
  }
  return null;
}

export default function Recipes({ recipes }) {
  if (!recipes || recipes.length === 0) return null;
  return (
    <div className="recipes">
      <div className="section-title">🎥 Recetas y tips</div>
      <div className="recipe-row">
        {recipes.map((r) => {
          const embed = toEmbedUrl(r.video_url);
          return (
            <div className="recipe-card" key={r.id}>
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
              <div className="rbody">
                <b>{r.title}</b>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
