import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";

type ListingImage = { sourceRef: string; storageKey: string | null; alt: string; position: number };
type Listing = {
  headline: string;
  status: string;
  category: string;
  addressLine: string;
  suburb: string;
  postcode: string;
  state: string;
  priceLabel: string;
  description: string;
  beds: number | null;
  baths: number | null;
  parking: number | null;
  landSqm: number | null;
  floorSqm: number | null;
  images: ListingImage[];
  features: string[];
  similar: Array<{ slug: string; headline: string; suburb: string; priceLabel: string; status: string; category: string }>;
};

function usableImage(image: ListingImage): string | null {
  const candidate = image.storageKey?.startsWith("/") ? image.storageKey : image.sourceRef;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? candidate : null;
  } catch {
    return null;
  }
}

export default function Property() {
  const { slug } = useParams();
  const [property, setProperty] = useState<Listing | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setProperty(null);
    setState("loading");
    setImageIndex(0);
    setImageFailed(false);

    fetch(`/api/listings/${encodeURIComponent(slug ?? "")}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) {
          setState("missing");
          return null;
        }
        if (!response.ok) throw new Error("Could not load this property.");
        return response.json() as Promise<Listing>;
      })
      .then((result) => {
        if (!result) return;
        setProperty(result);
        setState("ready");
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setState("error");
      });

    return () => controller.abort();
  }, [slug]);

  if (state === "loading") return <p className="loading-panel page-message" role="status">Finding the details…</p>;
  if (state === "missing") return <section className="empty-panel page-message"><h1>This place has moved on.</h1><p>This listing may have been updated or removed.</p><Link className="text-link" to="/buy">Explore available properties <span aria-hidden="true">↗</span></Link></section>;
  if (state === "error" || !property) return <section className="empty-panel page-message"><h1>We can’t reach this property right now.</h1><p>Please try again shortly, or speak with our team.</p><Link className="text-link" to="/contact">Contact V Group <span aria-hidden="true">↗</span></Link></section>;

  const gallery = property.images
    .map((image) => ({ src: usableImage(image), alt: image.alt }))
    .filter((image): image is { src: string; alt: string } => image.src !== null);
  const currentImage = gallery[imageIndex];
  const imageSrc = currentImage && !imageFailed ? currentImage.src : "/images/interior-light.jpg";

  return (
    <article className="property-page">
      <section className="property-hero">
        <img
          className="property-hero-image"
          src={imageSrc}
          alt={currentImage && !imageFailed ? currentImage.alt : "Editorial interior photography; indicative imagery, not the listed property"}
          onError={() => setImageFailed(true)}
        />
        <div className="property-hero-shade" />
        <Link className="property-back" to="/portfolio">← Property portfolio</Link>
        <div className="property-hero-copy">
          <p className="eyebrow eyebrow-light">{property.category.replaceAll("_", " ")} <span>·</span> {property.suburb}</p>
          <h1>{property.headline}</h1>
          <p>{property.addressLine}, {property.suburb} {property.state} {property.postcode}</p>
          <strong>{property.priceLabel}</strong>
        </div>
        {(!currentImage || imageFailed) && <span className="property-image-note">EDITORIAL PHOTOGRAPHY · INDICATIVE ONLY</span>}
        {gallery.length > 1 && (
          <div className="gallery-controls" aria-label="Property photo gallery">
            <button type="button" aria-label="Previous photo" onClick={() => { setImageIndex((index) => (index - 1 + gallery.length) % gallery.length); setImageFailed(false); }}>←</button>
            <span>{String(imageIndex + 1).padStart(2, "0")} <i>/</i> {String(gallery.length).padStart(2, "0")}</span>
            <button type="button" aria-label="Next photo" onClick={() => { setImageIndex((index) => (index + 1) % gallery.length); setImageFailed(false); }}>→</button>
          </div>
        )}
      </section>
      {gallery.length > 1 && (
        <div className="gallery-strip" aria-label="Choose a property photograph">
          {gallery.map((image, index) => (
            <button key={`${image.src}-${index}`} type="button" className={index === imageIndex ? "is-current" : ""} aria-label={`Show photo ${index + 1}`} aria-current={index === imageIndex} onClick={() => { setImageIndex(index); setImageFailed(false); }}>
              <img src={image.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      <section className="property-facts">
        <span><strong>{property.beds ?? "—"}</strong> bedrooms</span>
        <span><strong>{property.baths ?? "—"}</strong> bathrooms</span>
        <span><strong>{property.parking ?? "—"}</strong> parking</span>
        {property.landSqm !== null && <span><strong>{property.landSqm}</strong> m² land</span>}
        {property.floorSqm !== null && <span><strong>{property.floorSqm}</strong> m² floor</span>}
        {property.status !== "ACTIVE" && <span className="badge">{property.status.replaceAll("_", " ")}</span>}
      </section>

      <section className="property-story">
        <Reveal className="property-description">
          <p className="eyebrow"><span className="eyebrow-line" /> A CLOSER LOOK</p>
          <h2>A place to<br /><em>make your own.</em></h2>
          <p>{property.description}</p>
          <div className="property-actions">
            <Link className="button-link" to={`/contact?listing=${encodeURIComponent(slug ?? "")}`}>Enquire about this property <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" to={`/book-inspection?listing=${encodeURIComponent(slug ?? "")}`}>Request an inspection <span aria-hidden="true">↗</span></Link>
          </div>
          {property.features.length > 0 && <ul className="property-feature-list" aria-label="Property features">{property.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
        </Reveal>
        <figure className="property-editorial">
          <img src="/images/quiet-interior.jpg" alt="Editorial photography of a calm, light-filled interior" loading="lazy" />
          <figcaption>V/G JOURNAL <span>—</span> A SENSE OF HOME</figcaption>
        </figure>
      </section>

      <section className="property-contact">
        <p className="eyebrow eyebrow-light">THE NEXT STEP</p>
        <h2>Could this be<br /><em>your place?</em></h2>
        <Link className="light-link" to={`/contact?listing=${encodeURIComponent(slug ?? "")}`}>Speak with our team <span aria-hidden="true">↗</span></Link>
      </section>
      {property.similar.length > 0 && (
        <section className="similar-properties">
          <p className="eyebrow"><span className="eyebrow-line" /> MORE TO EXPLORE</p>
          <h2>Places with a similar point of view.</h2>
          <div className="similar-property-list">{property.similar.map((item) => <Link key={item.slug} to={`/property/${item.slug}`}><span>{item.category.replaceAll("_", " ")} · {item.suburb}</span><strong>{item.headline}</strong><span>{item.priceLabel}</span></Link>)}</div>
        </section>
      )}
    </article>
  );
}
