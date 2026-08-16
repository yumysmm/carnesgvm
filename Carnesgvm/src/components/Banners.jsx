export default function Banners({ banners }) {
  if (!banners || banners.length === 0) return null;
  return (
    <div className="banners">
      {banners.map((b) => {
        const img = <img src={b.image_url} alt="" loading="lazy" />;
        return (
          <div className="banner-slide" key={b.id}>
            {b.link_url ? (
              <a href={b.link_url} target="_blank" rel="noreferrer">
                {img}
              </a>
            ) : (
              img
            )}
          </div>
        );
      })}
    </div>
  );
}
