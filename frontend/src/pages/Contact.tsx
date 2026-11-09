import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Reveal from "../components/Reveal";

type FormErrors = Record<string, string[]>;

export default function Contact() {
  const [searchParams] = useSearchParams();
  const listingSlug = searchParams.get("listing");
  const requestedType = searchParams.get("type") ?? "";
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setSubmitting(true);
    setMessage("");
    setMessageType("");
    setErrors({});
    const body = {
      type: String(f.get("type") || "GENERAL"),
      name: f.get("name"),
      email: f.get("email"),
      phone: f.get("phone"),
      message: f.get("message"),
      suburb: f.get("suburb"),
      budget: f.get("budget"),
      preferredContact: f.get("preferredContact") || "EITHER",
      marketingConsent: f.get("marketing") === "on",
      website: f.get("website") ?? "",
      ...(listingSlug ? { listingSlug } : {}),
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as { message?: string; error?: string; issues?: FormErrors };
      setErrors(result.issues ?? {});
      if (!response.ok) {
        setMessage(result.error ?? "We couldn’t send your enquiry. Please check the details and try again.");
        setMessageType("error");
        return;
      }
      setMessage(result.message ?? "Your enquiry has been received.");
      setMessageType("success");
      form.reset();
    } catch {
      setMessage("We couldn’t connect to the enquiry service. Please try again in a moment.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="contact-page">
      <Reveal className="contact-intro">
        <img src="/images/courtyard.jpg" alt="" />
        <div className="contact-intro-shade" />
        <div className="contact-intro-content">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> LET’S TALK PROPERTY</p>
          <h1>Every good move<br />starts <em>somewhere.</em></h1>
          <p>{listingSlug ? "Ask us a question about this property and our team will be in touch." : "Tell us what you’re looking for and our team will be in touch."}</p>
          <div className="contact-aside"><span className="aside-index">V/G — 01</span><span>Melbourne<br />Victoria, Australia</span></div>
          <span className="contact-image-note">A QUIETER KIND OF HOME · EDITORIAL</span>
        </div>
      </Reveal>
      <form className="contact-form" onSubmit={submit}>
        <p className="eyebrow">YOUR ENQUIRY</p>
        <label>What can we help with?
          <select name="type" defaultValue={listingSlug ? "PROPERTY" : requestedType || "GENERAL"}>
            <option value="GENERAL">General enquiry</option>
            {listingSlug && <option value="PROPERTY">Question about a property</option>}
            <option value="BUY">Buying a property</option>
            <option value="RENT">Renting a property</option>
            <option value="SELL">Selling a property</option>
            <option value="LANDLORD">Property management</option>
            <option value="COMMERCIAL">Commercial property</option>
            <option value="CONSULTATION">Request a consultation</option>
          </select>
        </label>
        {(["name", "email", "phone"] as const).map((key) => (
          <label key={key}>
            {key === "name" ? "Full name" : key === "email" ? "Email address" : "Phone number"}
            <input
              name={key}
              type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
              autoComplete={key === "name" ? "name" : key === "email" ? "email" : "tel"}
              required
              aria-invalid={!!errors[key]}
              aria-describedby={errors[key] ? `${key}-error` : undefined}
            />
            {errors[key] && <span id={`${key}-error`} className="err">{errors[key][0]}</span>}
          </label>
        ))}
        <label>Preferred location (optional)<input name="suburb" maxLength={80} placeholder="Suburb or area" /></label>
        <label>Budget or price guide (optional)<input name="budget" maxLength={80} placeholder="As a guide" /></label>
        <label>How would you prefer us to contact you?
          <select name="preferredContact" defaultValue="EITHER">
            <option value="EITHER">Either email or phone</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
          </select>
        </label>
        <label>Your message
          <textarea name="message" rows={4} maxLength={2000} placeholder="A little about what you have in mind…" />
          {errors.message && <span className="err">{errors.message[0]}</span>}
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
        <label className="check"><input type="checkbox" name="marketing" /> I’d like to receive occasional updates (optional)</label>
        <button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send your enquiry"} <span aria-hidden="true">→</span></button>
        {listingSlug && <Link className="text-link" to={`/book-inspection?listing=${encodeURIComponent(listingSlug)}`}>Request a property inspection <span aria-hidden="true">↗</span></Link>}
        <p className={`form-feedback ${messageType}`} role={messageType === "error" ? "alert" : "status"}>{message}</p>
      </form>
    </section>
  );
}
