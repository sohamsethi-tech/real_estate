import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Reveal from "../components/Reveal";

type Content = { key: string; title: string; body: string };
type Agent = {
  id: string;
  name: string;
  title: string | null;
  biography: string | null;
  phone: string | null;
  email: string | null;
  photoKey: string | null;
};
type Testimonial = {
  id: string;
  reviewer: string;
  body: string;
  reviewDate: string;
  suburb: string | null;
};
type Faq = { key: string; question: string; answer: string };

const pageTitles: Record<string, string> = {
  about: "About V Group",
  services: "Our services",
  sell: "Sell with us",
  lease: "Lease with us",
  privacy: "Privacy",
  terms: "Terms and conditions",
  cookies: "Cookie information",
  ai: "AI assistant disclosure",
};

function usePublicData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(false);
    fetch(path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Content unavailable");
        return response.json() as Promise<T>;
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, [path]);
  return { data, error };
}

export function ContentPage({ pageKey }: { pageKey: string }) {
  const { data, error } = usePublicData<Content>(`/api/content/${encodeURIComponent(pageKey)}`);
  const title = data?.title ?? pageTitles[pageKey] ?? "V Group Real Estate";
  const contactType = pageKey === "sell" ? "SELL" : pageKey === "lease" ? "LANDLORD" : undefined;
  return (
    <article className="editorial-page">
      <header className="editorial-page-hero">
        <img src="/images/architecture-detail.jpg" alt="" />
        <div className="editorial-page-shade" />
        <div><p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> V GROUP · MELBOURNE &amp; VICTORIA</p><h1>{title}</h1></div>
      </header>
      <Reveal className="editorial-page-body">
        {data ? <p className="editorial-copy">{data.body}</p> : (
          <div className="notice">
            <h2>{error ? "Information is temporarily unavailable." : "Loading information…"}</h2>
            {error && <p>For the latest information, please contact V Group directly.</p>}
          </div>
        )}
        {contactType && <Link className="button-link" to={`/contact?type=${contactType}`}>Tell us about your property <span aria-hidden="true">↗</span></Link>}
        {pageKey === "services" && <div className="editorial-actions"><Link className="text-link" to="/buy">Explore properties <span aria-hidden="true">↗</span></Link><Link className="text-link" to="/book-consultation">Book a consultation <span aria-hidden="true">↗</span></Link></div>}
      </Reveal>
      {pageKey === "services" && <PublicFaqs />}
    </article>
  );
}

function PublicFaqs() {
  const { data, error } = usePublicData<{ items: Faq[] }>("/api/content/faqs");
  if (error || !data?.items.length) return null;
  return <section className="public-faqs"><p className="eyebrow"><span className="eyebrow-line" /> A FEW THINGS TO KNOW</p><h2>Frequently asked.</h2><div>{data.items.map((item) => <details key={item.key}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>;
}

export function TeamPage() {
  const { data, error } = usePublicData<{ items: Agent[] }>("/api/content/team");
  return (
    <section className="people-page">
      <header className="simple-page-heading"><p className="eyebrow"><span className="eyebrow-line" /> THE PEOPLE BEHIND V/GROUP</p><h1>Local knowledge.<br /><em>Personal attention.</em></h1><p>Meet the team members V Group has chosen to introduce.</p></header>
      {error && <p className="notice" role="status">Team profiles are temporarily unavailable. Please try again later.</p>}
      {!error && data?.items.length === 0 && <p className="empty-panel">No team profiles have been published yet.</p>}
      {data && data.items.length > 0 && (
        <div className="people-grid">
          {data.items.map((agent) => (
            <article className="person-card" key={agent.id}>
              {agent.photoKey ? <img src={agent.photoKey} alt={agent.name} loading="lazy" /> : <div className="person-placeholder" aria-hidden="true">V/G</div>}
              <p className="eyebrow">{agent.title ?? "V Group Real Estate"}</p><h2>{agent.name}</h2>
              {agent.biography && <p>{agent.biography}</p>}
              <div className="person-links">{agent.phone && <a href={`tel:${agent.phone}`}>{agent.phone}</a>}{agent.email && <a href={`mailto:${agent.email}`}>Email {agent.name.split(" ")[0]}</a>}</div>
            </article>
          ))}
        </div>
      )}
      <div className="people-cta"><p>Looking for a conversation about property?</p><Link className="button-link" to="/contact">Speak with V Group <span aria-hidden="true">↗</span></Link></div>
    </section>
  );
}

export function TestimonialsPage() {
  const { data, error } = usePublicData<{ items: Testimonial[] }>("/api/content/testimonials");
  return (
    <section className="people-page">
      <header className="simple-page-heading"><p className="eyebrow"><span className="eyebrow-line" /> WORDS FROM CLIENTS</p><h1>Experiences,<br /><em>in their own words.</em></h1><p>Only testimonials approved for publication by V Group are shown here.</p></header>
      {error && <p className="notice" role="status">Testimonials are temporarily unavailable. Please try again later.</p>}
      {!error && data?.items.length === 0 && <p className="empty-panel">There are no approved testimonials to display yet.</p>}
      {data && data.items.length > 0 && (
        <div className="testimonial-grid">
          {data.items.map((item) => (
            <blockquote className="testimonial-card" key={item.id}>
              <span className="testimonial-mark" aria-hidden="true">“</span>
              <p>{item.body}</p>
              <footer><strong>{item.reviewer}</strong><span>{[item.suburb, new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(item.reviewDate))].filter(Boolean).join(" · ")}</span></footer>
            </blockquote>
          ))}
        </div>
      )}
    </section>
  );
}

export function BookingPage({ kind }: { kind: "INSPECTION" | "CONSULTATION" }) {
  const [searchParams] = useSearchParams();
  const listingSlug = searchParams.get("listing") ?? "";
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmitting(true);
    setFeedback("");
    setFeedbackType("");
    setReference("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: values.get("name"),
          email: values.get("email"),
          phone: values.get("phone"),
          date: values.get("date"),
          time: values.get("time"),
          message: values.get("message"),
          listingSlug: listingSlug || undefined,
          website: values.get("website") ?? "",
        }),
      });
      const result = await response.json() as { reference?: string; message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not submit the request. Please check your details.");
      setReference(result.reference ?? "");
      setFeedback(result.message ?? "Your request is pending approval; it isn't a confirmed appointment.");
      setFeedbackType("success");
      form.reset();
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "The booking service couldn't be reached. Please try again.");
      setFeedbackType("error");
    } finally {
      setSubmitting(false);
    }
  }

  const inspection = kind === "INSPECTION";
  return (
    <section className="booking-page">
      <header className="simple-page-heading"><p className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT STEP</p><h1>{inspection ? "Request an inspection." : "Let's talk it through."}</h1><p>{inspection ? "Choose a preferred time. An inspection is not confirmed until the V Group team approves your request." : "Request a time for a conversation with the V Group team."}</p></header>
      <form className="booking-form" onSubmit={submit}>
        {listingSlug && <p className="notice">Property reference: {listingSlug}</p>}
        <div className="form-grid">
          <label>Full name<input name="name" autoComplete="name" required maxLength={120} /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={200} /></label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" required placeholder="04xx xxx xxx" /></label>
          <label>Preferred date<input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} /></label>
          <label>Preferred time<input name="time" type="time" required /></label>
          <label className="form-grid-wide">Message<textarea name="message" rows={4} maxLength={2000} /></label>
        </div>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
        <button className="button-link" type="submit" disabled={submitting}>{submitting ? "Sending request…" : "Request a time"} <span aria-hidden="true">↗</span></button>
        <p className={`form-feedback ${feedbackType}`} role={feedbackType === "error" ? "alert" : "status"}>{reference && <strong>Reference {reference}. </strong>}{feedback}</p>
      </form>
    </section>
  );
}
