import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type PropertyItem = {
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
type Suburb = { suburb: string; count: number };
type Agent = { id: string; name: string; title: string | null; biography: string | null; photoKey: string | null };
type Testimonial = { id: string; reviewer: string; body: string; suburb: string | null };

function getImage(item: PropertyItem) {
  const image = item.image;
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

function PropertyRow({ item }: { item: PropertyItem }) {
  const image = getImage(item);
  return (
    <Link className="home-property-card" to={`/property/${encodeURIComponent(item.slug)}`}>
      {image ? <img src={image} alt={item.image?.alt ?? item.headline} loading="lazy" /> : <div className="home-property-placeholder"><span>Property image not supplied</span></div>}
      <div className="home-property-copy">
        <p className="eyebrow">{item.category.replaceAll("_", " ")} <span>·</span> {item.suburb}</p>
        <h3>{item.headline}</h3>
        <div className="home-property-meta"><span>{item.beds ?? "—"} bed</span><span>{item.baths ?? "—"} bath</span><span>{item.parking ?? "—"} car</span></div>
        <strong>{item.priceLabel}</strong>
      </div>
      <span className="home-property-arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

function PropertyCollection({ title, view, link, linkLabel }: { title: string; view: "featured" | "sold"; link: string; linkLabel: string }) {
  const [items, setItems] = useState<PropertyItem[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/listings?view=${view}&page=1`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Properties unavailable");
        return response.json() as Promise<{ items: PropertyItem[] }>;
      })
      .then((result) => { setItems(result.items.slice(0, 3)); setStatus("ready"); })
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) setStatus("error");
      });
    return () => controller.abort();
  }, [view]);
  if (status === "loading") return <p className="home-data-status" role="status">Loading {title.toLowerCase()}…</p>;
  if (status === "error") return <p className="home-data-status" role="status">The {title.toLowerCase()} collection is unavailable right now. Please try again later or <Link to="/contact">contact V Group</Link>.</p>;
  if (!items?.length) return <p className="home-data-status">{title === "Recently sold" ? "No sold property records have been published yet." : "No featured property records are available right now."}</p>;
  return (
    <section className="home-collection">
      <div className="home-collection-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> V/G PROPERTY</p><h2>{title}</h2></div><Link className="text-link" to={link}>{linkLabel} <span aria-hidden="true">↗</span></Link></div>
      <div className="home-property-grid">{items.map((item) => <PropertyRow key={item.slug} item={item} />)}</div>
    </section>
  );
}

export default function PropertyCollections() {
  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [suburbsError, setSuburbsError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/listings/suburbs", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Locations unavailable");
        return response.json() as Promise<{ items: Suburb[] }>;
      })
      .then((result) => setSuburbs(result.items.slice(0, 4)))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) setSuburbsError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <PropertyCollection title="Selected properties" view="featured" link="/buy" linkLabel="Explore all homes" />
      <PropertyCollection title="Recently sold" view="sold" link="/portfolio" linkLabel="View our portfolio" />
      {suburbsError && <p className="home-data-status" role="status">Current location data is temporarily unavailable.</p>}
      {suburbs.length > 0 && (
        <section className="community-section">
          <div className="home-collection-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> FIND A PLACE TO BELONG</p><h2>Explore by suburb.</h2></div><span className="community-note">Locations with current V Group listings</span></div>
          <div className="community-list">{suburbs.map((item, index) => <Link key={item.suburb} to={`/buy?suburb=${encodeURIComponent(item.suburb)}`}><span className="community-index">{String(index + 1).padStart(2, "0")}</span><strong>{item.suburb}</strong><span>{item.count} {item.count === 1 ? "listing" : "listings"}</span><b aria-hidden="true">↗</b></Link>)}</div>
        </section>
      )}
    </>
  );
}

export function HomeHighlights() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch("/api/content/team", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<{ items: Agent[] }> : Promise.reject(new Error("Team unavailable"))),
      fetch("/api/content/testimonials", { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<{ items: Testimonial[] }> : Promise.reject(new Error("Testimonials unavailable"))),
    ]).then(([team, reviews]) => {
      if (team.status === "fulfilled") setAgents(team.value.items.slice(0, 3));
      if (reviews.status === "fulfilled") setTestimonial(reviews.value.items[0] ?? null);
      if (team.status === "rejected" || reviews.status === "rejected") setUnavailable(true);
    }).catch((error: unknown) => {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setUnavailable(true);
      }
    });
    return () => controller.abort();
  }, []);

  if (unavailable && !agents.length && !testimonial) return <p className="home-data-status" role="status">Team and client stories are temporarily unavailable.</p>;
  if (!agents.length && !testimonial && !unavailable) return null;
  return (
    <section className="home-highlights">
      {unavailable && <p className="home-data-status" role="status">Some team or client information is temporarily unavailable.</p>}
      {agents.length > 0 && (
        <div className="home-team">
          <div className="home-collection-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> A LOCAL TEAM</p><h2>People, not just property.</h2></div><Link className="text-link" to="/team">Meet the team <span aria-hidden="true">↗</span></Link></div>
          <div className="home-agent-list">{agents.map((agent) => <Link to="/team" className="home-agent" key={agent.id}>{agent.photoKey ? <img src={agent.photoKey} alt="" loading="lazy" /> : <span className="home-agent-monogram" aria-hidden="true">V/G</span>}<span><strong>{agent.name}</strong><small>{agent.title ?? "V Group Real Estate"}</small></span><b aria-hidden="true">↗</b></Link>)}</div>
        </div>
      )}
      {testimonial && (
        <blockquote className="home-quote"><p className="eyebrow eyebrow-light">A CLIENT’S PERSPECTIVE</p><p className="home-quote-body">“{testimonial.body}”</p><footer>{testimonial.reviewer}{testimonial.suburb ? ` · ${testimonial.suburb}` : ""}<Link to="/testimonials">Read more <span aria-hidden="true">↗</span></Link></footer></blockquote>
      )}
    </section>
  );
}
