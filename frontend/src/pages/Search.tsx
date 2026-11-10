import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Reveal from "../components/Reveal";

type Item = {
  slug: string;
  headline: string;
  suburb: string;
  priceLabel: string;
  beds: number | null;
  baths: number | null;
  parking: number | null;
  category: string;
  status: string;
  image: { sourceRef: string; storageKey: string | null; alt: string } | null;
};
type Result = { items: Item[]; total: number; page: number; pageSize: number };
type Filters = { suburb: string; beds: string; baths: string; parking: string; minPrice: string; maxPrice: string; sort: string };
const emptyFilters: Filters = { suburb: "", beds: "", baths: "", parking: "", minPrice: "", maxPrice: "", sort: "newest" };

function imageUrl(image: Item["image"]) {
  if (!image) return null;
  const candidate = image.storageKey?.startsWith("/") ? image.storageKey : image.sourceRef;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? candidate : null;
  } catch {
    return null;
  }
}

export default function Search({ title, type, category, view }: { title: string; type?: string; category?: string; view?: string }) {
  const [sp, setSp] = useSearchParams();
  const query = sp.toString();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(query);
    setFilters({
      suburb: params.get("suburb") ?? "",
      beds: params.get("beds") ?? "",
      baths: params.get("baths") ?? "",
      parking: params.get("parking") ?? "",
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
      sort: params.get("sort") ?? "newest",
    });
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(query);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    if (view) params.set("view", view);
    setLoading(true);
    setError("");

    fetch(`/api/listings?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("We couldn’t load properties right now. Please try again.");
        return response.json() as Promise<Result>;
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "We couldn’t load properties right now. Please try again.");
        setData(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [query, type, category, view, reload]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    setSp(params);
  }

  function changePage(page: number) {
    const params = new URLSearchParams(query);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    setSp(params);
  }

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0;
  const field = (key: keyof Filters, label: string, type = "text") => (
    <label key={key}>
      <span>{label}</span>
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        name={key}
        value={filters[key]}
        onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}
      />
    </label>
  );

  return (
    <section className="listing-page">
      <div className="browse-masthead">
        <img src="/images/architecture-detail.jpg" alt="" />
        <div className="browse-masthead-shade" />
        <div className="browse-title">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> V GROUP PROPERTY</p>
          <h1>{title}</h1>
          <p>Find a place that fits the way you want to live.</p>
        </div>
        <span className="browse-image-note">EDITORIAL PROPERTY PHOTOGRAPHY</span>
      </div>
      <div className="search-content">
        <form className="filters" onSubmit={applyFilters}>
          <p className="filter-title">REFINE YOUR SEARCH</p>
          {field("suburb", "Suburb")}
          {field("beds", "Bedrooms · min", "number")}
          {field("baths", "Bathrooms · min", "number")}
          {field("parking", "Parking · min", "number")}
          {field("minPrice", "Min price · AUD", "number")}
          {field("maxPrice", "Max price · AUD", "number")}
          <label><span>Sort by</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="newest">Newest</option><option value="price_asc">Price · low to high</option><option value="price_desc">Price · high to low</option></select></label>
          <button type="submit">Update search <span aria-hidden="true">↗</span></button>
        </form>
        <div className="results-bar" aria-live="polite">
          <p>{loading ? "Finding properties…" : data ? `${data.total} ${data.total === 1 ? "property" : "properties"} to explore` : "Search results"}</p>
          {data && data.total > 0 && <span>Page {data.page} of {pageCount}</span>}
        </div>
        {error && <div className="notice notice-error" role="alert"><p>{error}</p><button type="button" className="button-secondary" onClick={() => setReload((count) => count + 1)}>Try again</button></div>}
        {loading && <div className="loading-panel" role="status">Finding the right places for you…</div>}
        {!loading && !error && data?.items.length === 0 && (
          <div className="empty-panel"><span className="empty-mark" aria-hidden="true">⌕</span><h2>No matches just yet</h2><p>Try a different suburb or broaden your filters to see more properties.</p></div>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="results-layout">
              <ul className="property-grid">
                {data.items.map((item, index) => {
                  const photo = imageUrl(item.image);
                  return (
                  <li key={item.slug}>
                    <Reveal delay={Math.min(index, 5) * 70}>
                      <Link className="property-card" to={`/property/${item.slug}`}>
                        <span className="property-card-media">
                          {photo ? <img src={photo} alt={item.image?.alt ?? item.headline} loading="lazy" decoding="async" /> : <span className="home-property-placeholder"><span>Image not supplied</span></span>}
                          <span className="property-card-index">{String((data.page - 1) * data.pageSize + index + 1).padStart(2, "0")}</span>
                          {item.status !== "ACTIVE" && <span className="badge">{item.status.replaceAll("_", " ")}</span>}
                        </span>
                        <span className="property-card-copy">
                          <span className="property-meta">{item.category.replaceAll("_", " ")} <span>·</span> {item.suburb}</span>
                          <strong>{item.headline}</strong>
                          <span className="property-features">{item.beds ?? "—"} bedrooms <span>·</span> {item.baths ?? "—"} bathrooms <span>·</span> {item.parking ?? "—"} parking</span>
                          <span className="property-card-price">{item.priceLabel} <span aria-hidden="true">↗</span></span>
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                  );
                })}
              </ul>
              <aside className="browse-aside">
                <img src="/images/courtyard.jpg" alt="Editorial photography of a quiet courtyard and contemporary home" loading="lazy" />
                <span className="browse-image-note">A SENSE OF PLACE · EDITORIAL</span>
                <div className="browse-aside-copy">
                  <span className="eyebrow">MELBOURNE &amp; VICTORIA</span>
                  <p>Not sure where to begin?</p>
                  <Link to="/contact">Talk it through with us <span aria-hidden="true">↗</span></Link>
                </div>
              </aside>
            </div>
            {pageCount > 1 && (
              <div className="pagination" aria-label="Search result pages">
                <button type="button" className="button-secondary" disabled={data.page <= 1} onClick={() => changePage(data.page - 1)}>← Previous</button>
                <span>Page {data.page} of {pageCount}</span>
                <button type="button" className="button-secondary" disabled={data.page >= pageCount} onClick={() => changePage(data.page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
