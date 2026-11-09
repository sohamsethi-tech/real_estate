import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

type User = { name: string; email: string; role: string };
type Listing = {
  id: string;
  reference: string;
  headline: string;
  description: string;
  addressLine: string;
  suburb: string;
  state: string;
  postcode: string;
  listingType: string;
  category: string;
  status: string;
  priceLabel: string;
  priceMin: number | null;
  priceMax: number | null;
  beds: number | null;
  baths: number | null;
  parking: number | null;
  landSqm: number | null;
  floorSqm: number | null;
  featured: boolean;
  archived: boolean;
  agentId: string | null;
  features: Array<{ label: string }>;
  images: Array<{ id: string; storageKey: string | null; alt: string; isPrimary: boolean; position: number }>;
};
type Lead = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  suburb: string | null;
  budget: string | null;
  message: string | null;
  assignedToId: string | null;
  agentId: string | null;
  events: Array<{ id: string; kind: string; detail: string | null; createdAt: string }>;
};
type Booking = {
  id: string;
  reference: string;
  kind: string;
  status: string;
  agentId: string | null;
  when: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  listing: { reference: string; headline: string } | null;
};
type Agent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  biography: string | null;
  published: boolean;
  userId: string | null;
};
type Testimonial = { id: string; reviewer: string; body: string; sourceNote: string | null; approved: boolean; featured: boolean; reviewDate: string; suburb: string | null };
type PageContent = { key: string; title: string; body: string; published: boolean };
type Faq = { id: string; question: string; answer: string; published: boolean };
type StaffUser = { id: string; name: string; email: string; active: boolean };

const request = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET") headers.set("X-VG-Request", "1");
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const result: unknown = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return result as T;
};

const send = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

const tabs = ["Overview", "Properties", "Leads", "Bookings", "Agents", "Testimonials", "Website content", "FAQs", "Staff", "Settings", "Reports"] as const;
type Tab = typeof tabs[number];

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("Overview");
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    try {
      setUser(await request<User>("/api/auth/me"));
      setError("");
    } catch (reason) {
      setUser(null);
      if (reason instanceof Error && reason.message !== "Sign in required" && !reason.message.includes("401")) setError(reason.message);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void refreshUser(); }, [refreshUser]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setError("");
      await request("/api/auth/login", send("POST", { email: form.get("email"), password: form.get("password") }));
      await refreshUser();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    }
  }

  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
      setUser(null);
      setTab("Overview");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out.");
    }
  }

  if (checking) return <p className="loading-panel page-message" role="status">Checking staff session…</p>;
  if (!user) return (
    <section className="admin-login">
      <p className="eyebrow"><span className="eyebrow-line" /> V/GROUP STAFF</p>
      <h1>Staff sign in.</h1>
      <p>This area is for authorised V Group staff.</p>
      <form className="booking-form" onSubmit={login}>
        <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="form-feedback error" role="alert">{error}</p>}
        <button className="button-link" type="submit">Sign in <span aria-hidden="true">↗</span></button>
      </form>
      <Link className="text-link" to="/">Return to the public website</Link>
    </section>
  );

  return (
    <section className="admin-shell">
      <header className="admin-header">
        <div><p className="eyebrow"><span className="eyebrow-line" /> V/GROUP · STAFF DESK</p><h1>Good to see you, {user.name}.</h1><p>{user.role.replaceAll("_", " ")} · {user.email}</p></div>
        <button className="button-secondary" type="button" onClick={() => void logout()}>Sign out</button>
      </header>
      <nav className="admin-tabs" aria-label="Staff desk sections">
        {tabs.map((item) => <button key={item} type="button" className={tab === item ? "selected" : ""} onClick={() => { setTab(item); setError(""); }}>{item}</button>)}
      </nav>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <div className="admin-panel">
        {tab === "Overview" && <Overview onError={setError} />}
        {tab === "Properties" && <PropertyAdmin onError={setError} />}
        {tab === "Leads" && <LeadAdmin onError={setError} />}
        {tab === "Bookings" && <BookingAdmin onError={setError} />}
        {tab === "Agents" && <AgentAdmin onError={setError} />}
        {tab === "Testimonials" && <TestimonialAdmin onError={setError} />}
        {tab === "Website content" && <ContentAdmin onError={setError} />}
        {tab === "FAQs" && <FaqAdmin onError={setError} />}
        {tab === "Staff" && <StaffAdmin onError={setError} />}
        {tab === "Settings" && <SettingsAdmin onError={setError} />}
        {tab === "Reports" && <ReportsAdmin onError={setError} />}
      </div>
    </section>
  );
}

function useLoad<T>(path: string, onError: (message: string) => void) {
  const [data, setData] = useState<T | null>(null);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    request<T>(path).then((result) => { if (active) setData(result); })
      .catch((reason: unknown) => { if (active) onError(reason instanceof Error ? reason.message : "Could not load this section."); });
    return () => { active = false; };
  }, [path, reload, onError]);
  return { data, refresh };
}

function Overview({ onError }: { onError: (message: string) => void }) {
  const { data } = useLoad<{ listings: Array<{ status: string; _count: { _all: number } }>; leads: Array<{ status: string; _count: { _all: number } }>; bookings: Array<{ status: string; _count: { _all: number } }>; agents: number; recentLeads: Array<{ reference: string; name: string; type: string; status: string }> }>("/api/admin/overview", onError);
  if (!data) return <p className="loading-panel">Loading overview…</p>;
  const total = (rows: Array<{ _count: { _all: number } }>) => rows.reduce((count, row) => count + row._count._all, 0);
  return <><h2>Overview</h2><div className="admin-stat-grid">{[["Properties", total(data.listings)], ["Enquiries", total(data.leads)], ["Bookings", total(data.bookings)], ["Published agent records", data.agents]].map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div><h3>Recent enquiries</h3>{data.recentLeads.length ? <DataTable headers={["Reference", "Name", "Type", "Status"]} rows={data.recentLeads.map((lead) => [lead.reference, lead.name, lead.type, lead.status])} /> : <p className="empty-panel">No enquiries yet.</p>}</>;
}

const initialListing = () => ({
  headline: "", description: "", addressLine: "", suburb: "", state: "VIC", postcode: "",
  listingType: "SALE", category: "HOUSE", status: "ACTIVE", priceLabel: "",
  priceMin: "", priceMax: "", beds: "", baths: "", parking: "", landSqm: "", floorSqm: "",
  features: "", featured: false, archived: false, agentId: "",
});

function PropertyAdmin({ onError }: { onError: (message: string) => void }) {
  const { data, refresh } = useLoad<{ items: Listing[] }>("/api/admin/listings", onError);
  const { data: agents } = useLoad<{ items: Agent[] }>("/api/admin/agents", onError);
  const [draft, setDraft] = useState(initialListing);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageKind, setImageKind] = useState<"PHOTO" | "FLOORPLAN">("PHOTO");

  function edit(item: Listing) {
    setEditing(item);
    setDraft({
      headline: item.headline, description: item.description, addressLine: item.addressLine, suburb: item.suburb,
      state: item.state, postcode: item.postcode, listingType: item.listingType, category: item.category,
      status: item.status, priceLabel: item.priceLabel, priceMin: item.priceMin?.toString() ?? "",
      priceMax: item.priceMax?.toString() ?? "", beds: item.beds?.toString() ?? "",
      baths: item.baths?.toString() ?? "", parking: item.parking?.toString() ?? "",
      landSqm: item.landSqm?.toString() ?? "", floorSqm: item.floorSqm?.toString() ?? "",
      features: item.features.map((feature) => feature.label).join(", "), featured: item.featured,
      archived: item.archived, agentId: item.agentId ?? "",
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nullableNumber = (value: string) => value === "" ? null : Number(value);
    const body = {
      ...draft,
      priceMin: nullableNumber(draft.priceMin), priceMax: nullableNumber(draft.priceMax),
      beds: nullableNumber(draft.beds), baths: nullableNumber(draft.baths), parking: nullableNumber(draft.parking),
      landSqm: nullableNumber(draft.landSqm), floorSqm: nullableNumber(draft.floorSqm),
      features: draft.features.split(",").map((value) => value.trim()).filter(Boolean),
      agentId: draft.agentId || null,
    };
    setSaving(true);
    try {
      await request(editing ? `/api/admin/listings/${editing.id}` : "/api/admin/listings", send(editing ? "PATCH" : "POST", body));
      setDraft(initialListing());
      setEditing(null);
      refresh();
      onError("");
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not save this property.");
    } finally {
      setSaving(false);
    }
  }

  async function archive(item: Listing) {
    if (!window.confirm(`Archive ${item.reference}?`)) return;
    try { await request(`/api/admin/listings/${item.id}`, { method: "DELETE" }); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not archive this property."); }
  }

  async function uploadImages(item: Listing, files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("images", file));
    form.append("kind", imageKind);
    try { await request(`/api/admin/listings/${item.id}/images`, { method: "POST", body: form }); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not upload images."); }
  }

  async function saveImageOrder(item: Listing, images: Listing["images"]) {
    try {
      await request(`/api/admin/listings/${item.id}/images`, send("PATCH", {
        items: images.map((image, position) => ({ id: image.id, position, isPrimary: image.isPrimary })),
      }));
      refresh();
    } catch (reason) { onError(reason instanceof Error ? reason.message : "Could not update property images."); }
  }

  async function removeImage(item: Listing, imageId: string) {
    if (!window.confirm("Delete this property image?")) return;
    try { await request(`/api/admin/listings/${item.id}/images/${imageId}`, { method: "DELETE" }); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not delete image."); }
  }

  const set = (key: keyof ReturnType<typeof initialListing>, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));
  const textField = (key: keyof ReturnType<typeof initialListing>, label: string, required = false, type = "text") => <label>{label}<input type={type} required={required} value={String(draft[key])} onChange={(event) => set(key, event.target.value)} /></label>;
  const selectField = (key: keyof ReturnType<typeof initialListing>, label: string, options: string[]) => <label>{label}<select value={String(draft[key])} onChange={(event) => set(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;

  return <><div className="admin-section-heading"><div><h2>Properties</h2><p>Only enter property details verified by V Group.</p></div><button className="button-secondary" type="button" onClick={() => { setEditing(null); setDraft(initialListing()); }}>Add property</button></div>
    <form className="admin-form" onSubmit={save}>
      <h3>{editing ? `Edit ${editing.reference}` : "Property details"}</h3>
      <div className="admin-form-grid">
        {textField("headline", "Property title", true)}
        {textField("addressLine", "Address", true)}
        {textField("suburb", "Suburb", true)}
        {textField("state", "State", true)}
        {textField("postcode", "Postcode", true)}
        {textField("priceLabel", "Price label", true)}
        {textField("priceMin", "Minimum price", false, "number")}
        {textField("priceMax", "Maximum price", false, "number")}
        {selectField("listingType", "Listing type", ["SALE", "RENT"])}
        {selectField("category", "Category", ["HOUSE", "APARTMENT", "TOWNHOUSE", "COMMERCIAL", "INDUSTRIAL", "LAND"])}
        {selectField("status", "Status", ["ACTIVE", "UNDER_OFFER", "SOLD", "LEASED", "WITHDRAWN", "OFF_MARKET"])}
        {textField("beds", "Bedrooms", false, "number")}
        {textField("baths", "Bathrooms", false, "number")}
        {textField("parking", "Parking", false, "number")}
        {textField("landSqm", "Land area (m²)", false, "number")}
        {textField("floorSqm", "Floor area (m²)", false, "number")}
        <label className="form-grid-wide">Description<textarea required minLength={10} maxLength={8000} rows={4} value={draft.description} onChange={(event) => set("description", event.target.value)} /></label>
        <label className="form-grid-wide">Features (separate with commas)<input value={draft.features} onChange={(event) => set("features", event.target.value)} /></label>
        <label>Assigned agent (optional)<select value={draft.agentId} onChange={(event) => set("agentId", event.target.value)}><option value="">Unassigned</option>{agents?.items.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
        <label className="admin-check"><input type="checkbox" checked={draft.featured} onChange={(event) => set("featured", event.target.checked)} /> Feature this property</label>
      </div>
      <div className="admin-actions"><button className="button-link" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save property" : "Add property"} <span aria-hidden="true">↗</span></button>{editing && <button className="button-secondary" type="button" onClick={() => { setEditing(null); setDraft(initialListing()); }}>Cancel edit</button>}</div>
    </form>
    <label className="image-kind-select">Image upload type<select value={imageKind} onChange={(event) => setImageKind(event.target.value as "PHOTO" | "FLOORPLAN")}><option value="PHOTO">Property photo</option><option value="FLOORPLAN">Floorplan</option></select></label>
    {!data ? <p className="loading-panel">Loading properties…</p> : data.items.length === 0 ? <p className="empty-panel">No property records yet. Add verified property data above.</p> : <div className="admin-record-list">{data.items.map((item) => <article className="admin-record admin-property-record" key={item.id}><div><strong>{item.headline}</strong><span>{item.reference} · {item.suburb} · {item.status.replaceAll("_", " ")}{item.archived ? " · ARCHIVED" : ""}</span></div><div className="admin-record-actions"><button type="button" onClick={() => edit(item)}>Edit</button><label className="file-button">Upload images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void uploadImages(item, event.currentTarget.files)} /></label>{!item.archived && <button type="button" onClick={() => void archive(item)}>Archive</button>}</div>{item.images.length > 0 && <div className="admin-image-grid">{[...item.images].sort((a, b) => a.position - b.position).map((image, index, list) => <div className="admin-image-card" key={image.id}>{image.storageKey && <img src={image.storageKey} alt={image.alt} loading="lazy" />}<span>{image.isPrimary ? "Primary" : image.alt}</span><div><button type="button" disabled={index === 0} onClick={() => { const reordered = [...list]; [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]; void saveImageOrder(item, reordered); }}>←</button><button type="button" onClick={() => void saveImageOrder(item, list.map((candidate) => ({ ...candidate, isPrimary: candidate.id === image.id })))}>{image.isPrimary ? "Primary" : "Set primary"}</button><button type="button" disabled={index === list.length - 1} onClick={() => { const reordered = [...list]; [reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]]; void saveImageOrder(item, reordered); }}>→</button><button type="button" onClick={() => void removeImage(item, image.id)}>Delete</button></div></div>)}</div>}</article>)}</div>}
  </>;
}

function LeadAdmin({ onError }: { onError: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const path = `/api/admin/leads${new URLSearchParams({ ...(query ? { q: query } : {}), ...(filter ? { status: filter } : {}) }).size ? `?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(filter ? { status: filter } : {}) })}` : ""}`;
  const { data, refresh } = useLoad<{ items: Lead[] }>(path, onError);
  const { data: agents } = useLoad<{ items: Agent[] }>("/api/admin/agents", onError);
  const { data: staff } = useLoad<{ items: StaffUser[] }>("/api/admin/staff", onError);
  const [notes, setNotes] = useState<Record<string, string>>({});
  async function update(id: string, changes: { status?: string; assignedToId?: string | null; agentId?: string | null }) {
    try { await request(`/api/admin/leads/${id}`, send("PATCH", changes)); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not update lead."); }
  }
  async function addNote(id: string) {
    if (!notes[id]?.trim()) return;
    try { await request(`/api/admin/leads/${id}/notes`, send("POST", { detail: notes[id] })); setNotes((current) => ({ ...current, [id]: "" })); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not save note."); }
  }
  return <><h2>Enquiries &amp; CRM</h2><div className="admin-filters"><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email or reference" /></label><label>Status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option>{["NEW", "ASSIGNED", "CONTACTED", "QUALIFIED", "INSPECTION_SCHEDULED", "NEGOTIATION", "CONVERTED", "LOST"].map((status) => <option key={status}>{status}</option>)}</select></label></div>{!data ? <p className="loading-panel">Loading enquiries…</p> : data.items.length === 0 ? <p className="empty-panel">No enquiries match this search.</p> : <div className="admin-record-list">{data.items.map((lead) => <article className="admin-record admin-record-stacked" key={lead.id}><div className="admin-record-top"><div><strong>{lead.reference} · {lead.name}</strong><span>{lead.type} · {lead.email} · {lead.phone}</span><span>{[lead.suburb, lead.budget].filter(Boolean).join(" · ")}</span>{lead.message && <p>{lead.message}</p>}</div><div className="admin-assignment"><label>Status<select value={lead.status} onChange={(event) => void update(lead.id, { status: event.target.value })}>{["NEW", "ASSIGNED", "CONTACTED", "QUALIFIED", "INSPECTION_SCHEDULED", "NEGOTIATION", "CONVERTED", "LOST"].map((status) => <option key={status}>{status}</option>)}</select></label><label>Assigned staff<select value={lead.assignedToId ?? ""} onChange={(event) => void update(lead.id, { assignedToId: event.target.value || null })}><option value="">Unassigned</option>{staff?.items.filter((person) => person.active).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Assigned agent<select value={lead.agentId ?? ""} onChange={(event) => void update(lead.id, { agentId: event.target.value || null })}><option value="">Unassigned</option>{agents?.items.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label></div></div><details><summary>History and internal notes ({lead.events.length})</summary><ul className="history-list">{lead.events.map((event) => <li key={event.id}><strong>{event.kind}</strong> · {event.detail ?? ""}</li>)}</ul><div className="note-entry"><input value={notes[lead.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [lead.id]: event.target.value }))} placeholder="Add internal note" maxLength={2000} /><button type="button" onClick={() => void addNote(lead.id)}>Save note</button></div></details></article>)}</div>}</>;
}

function BookingAdmin({ onError }: { onError: (message: string) => void }) {
  const { data, refresh } = useLoad<{ items: Booking[] }>("/api/admin/bookings", onError);
  const { data: agents } = useLoad<{ items: Agent[] }>("/api/admin/agents", onError);
  async function update(item: Booking, status: string) {
    try { await request(`/api/admin/bookings/${item.id}`, send("PATCH", { status })); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not update booking."); }
  }
  async function assign(item: Booking, agentId: string) {
    try { await request(`/api/admin/bookings/${item.id}`, send("PATCH", { status: item.status, agentId: agentId || null })); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not assign booking."); }
  }
  return <><h2>Bookings</h2><p>Every request remains pending until approved by an authorised team member.</p>{!data ? <p className="loading-panel">Loading bookings…</p> : data.items.length === 0 ? <p className="empty-panel">No booking requests yet.</p> : <div className="admin-record-list">{data.items.map((item) => <article className="admin-record" key={item.id}><div><strong>{item.reference} · {item.kind}</strong><span>{item.customerName} · {item.customerEmail} · {item.customerPhone}</span><span>{item.when}{item.listing ? ` · ${item.listing.reference} ${item.listing.headline}` : ""}</span></div><div className="admin-assignment"><label>Status<select value={item.status} onChange={(event) => void update(item, event.target.value)}>{["PENDING", "APPROVED", "DECLINED", "RESCHEDULE_REQUESTED", "CANCELLED"].map((status) => <option key={status}>{status.replaceAll("_", " ")}</option>)}</select></label><label>Assigned agent<select value={item.agentId ?? ""} onChange={(event) => void assign(item, event.target.value)}><option value="">Unassigned</option>{agents?.items.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label></div></article>)}</div>}</>;
}

function AgentAdmin({ onError }: { onError: (message: string) => void }) {
  const { data, refresh } = useLoad<{ items: Agent[] }>("/api/admin/agents", onError);
  const blank = () => ({ name: "", email: "", phone: "", title: "", biography: "", published: false, userId: "" });
  const [draft, setDraft] = useState(blank);
  const [editing, setEditing] = useState<Agent | null>(null);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const body = { ...draft, email: draft.email || null, phone: draft.phone || null, title: draft.title || null, biography: draft.biography || null, userId: draft.userId || null };
      await request(editing ? `/api/admin/agents/${editing.id}` : "/api/admin/agents", send(editing ? "PATCH" : "POST", body));
      setEditing(null); setDraft(blank()); refresh(); onError("");
    } catch (reason) { onError(reason instanceof Error ? reason.message : "Could not save agent."); }
  }
  async function photo(agent: Agent, file: File | undefined) {
    if (!file) return;
    const form = new FormData(); form.append("photo", file);
    try { await request(`/api/admin/agents/${agent.id}/photo`, { method: "POST", body: form }); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not upload photo."); }
  }
  const field = (key: keyof ReturnType<typeof blank>, label: string, required = false) => <label>{label}<input required={required} value={String(draft[key])} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>;
  return <><h2>Agents</h2><p>Publish only approved agent profiles and verified biographies.</p><form className="admin-form" onSubmit={save}><h3>{editing ? "Edit profile" : "Add agent profile"}</h3><div className="admin-form-grid">{field("name", "Name", true)}{field("email", "Email")}{field("phone", "Phone")}{field("title", "Title")}{field("userId", "Linked staff user ID")}<label className="form-grid-wide">Verified biography<textarea rows={4} value={draft.biography} onChange={(event) => setDraft((current) => ({ ...current, biography: event.target.value }))} /></label><label className="admin-check"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} /> Publish profile</label></div><button className="button-link" type="submit">{editing ? "Save profile" : "Add profile"} <span aria-hidden="true">↗</span></button>{editing && <button className="button-secondary" type="button" onClick={() => { setEditing(null); setDraft(blank()); }}>Cancel</button>}</form>{!data ? <p className="loading-panel">Loading agents…</p> : data.items.length === 0 ? <p className="empty-panel">No agent profiles have been added.</p> : <div className="admin-record-list">{data.items.map((agent) => <article className="admin-record" key={agent.id}><div><strong>{agent.name}</strong><span>{agent.title ?? "No title"} · {agent.published ? "Published" : "Unpublished"}</span></div><div className="admin-record-actions"><button type="button" onClick={() => { setEditing(agent); setDraft({ name: agent.name, email: agent.email ?? "", phone: agent.phone ?? "", title: agent.title ?? "", biography: agent.biography ?? "", published: agent.published, userId: agent.userId ?? "" }); }}>Edit</button><label className="file-button">Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void photo(agent, event.currentTarget.files?.[0])} /></label></div></article>)}</div>}</>;
}

function TestimonialAdmin({ onError }: { onError: (message: string) => void }) {
  const { data, refresh } = useLoad<{ items: Testimonial[] }>("/api/admin/testimonials", onError);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f = new FormData(event.currentTarget);
    try { await request("/api/admin/testimonials", send("POST", { reviewer: f.get("reviewer"), body: f.get("body"), sourceNote: f.get("sourceNote"), reviewDate: f.get("reviewDate"), suburb: f.get("suburb") || undefined, approved: false })); event.currentTarget.reset(); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not save testimonial."); }
  }
  async function toggle(item: Testimonial, field: "approved" | "featured") {
    try { await request(`/api/admin/testimonials/${item.id}`, send("PATCH", { [field]: !item[field] })); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not update testimonial."); }
  }
  async function remove(item: Testimonial) {
    if (!window.confirm(`Delete the testimonial from ${item.reviewer}?`)) return;
    try { await request(`/api/admin/testimonials/${item.id}`, { method: "DELETE" }); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not delete testimonial."); }
  }
  return <><h2>Testimonials</h2><form className="admin-form" onSubmit={create}><h3>Add a client testimonial</h3><div className="admin-form-grid"><label>Client name<input name="reviewer" required minLength={2} maxLength={120} /></label><label>Suburb (optional)<input name="suburb" maxLength={80} /></label><label>Review date<input name="reviewDate" type="date" required /></label><label>Source / permission note<input name="sourceNote" required minLength={3} maxLength={200} /></label><label className="form-grid-wide">Client's words<textarea name="body" required minLength={10} maxLength={2000} rows={4} /></label></div><button className="button-link">Save for review <span aria-hidden="true">↗</span></button></form>{!data ? <p className="loading-panel">Loading testimonials…</p> : <div className="admin-record-list">{data.items.map((item) => <article className="admin-record" key={item.id}><div><strong>{item.reviewer} · {item.approved ? "Approved" : "Draft"}</strong><span>{item.sourceNote} · {item.body}</span></div><div className="admin-record-actions"><button type="button" onClick={() => void toggle(item, "approved")}>{item.approved ? "Unpublish" : "Approve"}</button><button type="button" onClick={() => void toggle(item, "featured")}>{item.featured ? "Unfeature" : "Feature"}</button><button type="button" onClick={() => void remove(item)}>Delete</button></div></article>)}</div>}</>;
}

function ContentAdmin({ onError }: { onError: (message: string) => void }) {
  const { data, refresh } = useLoad<{ items: PageContent[] }>("/api/admin/content", onError);
  const [selected, setSelected] = useState("");
  const page = data?.items.find((item) => item.key === selected);
  const [draft, setDraft] = useState({ title: "", body: "", published: true });
  useEffect(() => { if (page) setDraft({ title: page.title, body: page.body, published: page.published }); }, [page]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await request(`/api/admin/content/${encodeURIComponent(selected)}`, send("PUT", draft)); refresh(); onError(""); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not save website content."); }
  }
  return <><h2>Website content</h2><p>Changes publish to the public page after saving.</p>{!data ? <p className="loading-panel">Loading pages…</p> : <><label className="content-select">Choose a page<select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Select a page</option>{data.items.map((item) => <option key={item.key} value={item.key}>{item.title} · {item.key}</option>)}</select></label>{page && <form className="admin-form" onSubmit={save}><label>Page title<input required maxLength={160} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label><label>Page content<textarea required minLength={2} maxLength={20000} rows={14} value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} /></label><label className="admin-check"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} /> Published</label><button className="button-link">Save content <span aria-hidden="true">↗</span></button></form>}</>}</>;
}

function FaqAdmin({ onError }: { onError: (message: string) => void }) {
  const { data, refresh } = useLoad<{ items: Faq[] }>("/api/admin/faqs", onError);
  const [edits, setEdits] = useState<Record<string, { question: string; answer: string }>>({});
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f = new FormData(event.currentTarget);
    try { await request("/api/admin/faqs", send("POST", { question: f.get("question"), answer: f.get("answer"), published: false })); event.currentTarget.reset(); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not add FAQ."); }
  }
  async function toggle(item: Faq) {
    try { await request(`/api/admin/faqs/${item.id}`, send("PATCH", { published: !item.published })); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not update FAQ."); }
  }
  async function save(item: Faq) {
    try { await request(`/api/admin/faqs/${item.id}`, send("PATCH", edits[item.id] ?? item)); refresh(); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Could not save FAQ."); }
  }
  return <><h2>FAQs</h2><form className="admin-form" onSubmit={create}><h3>Add a question</h3><label>Question<input name="question" required minLength={5} maxLength={200} /></label><label>Answer<textarea name="answer" required minLength={5} maxLength={4000} rows={4} /></label><button className="button-link">Save draft <span aria-hidden="true">↗</span></button></form>{!data ? <p className="loading-panel">Loading FAQs…</p> : <div className="admin-record-list">{data.items.map((item) => { const draft = edits[item.id] ?? { question: item.question, answer: item.answer }; return <article className="admin-record admin-faq-record" key={item.id}><label>Question<input value={draft.question} onChange={(event) => setEdits((current) => ({ ...current, [item.id]: { ...draft, question: event.target.value } }))} /></label><label>Answer<textarea rows={3} value={draft.answer} onChange={(event) => setEdits((current) => ({ ...current, [item.id]: { ...draft, answer: event.target.value } }))} /></label><div className="admin-record-actions"><button type="button" onClick={() => void save(item)}>Save changes</button><button type="button" onClick={() => void toggle(item)}>{item.published ? "Unpublish" : "Publish"}</button></div></article>; })}</div>}</>;
}

function StaffAdmin({ onError }: { onError: (message: string) => void }) {
  const { data } = useLoad<{ items: Array<{ id: string; name: string; email: string; role: string; active: boolean; agent: { id: string; published: boolean } | null }> }>("/api/admin/staff", onError);
  return <><h2>Staff</h2><p>Staff access is managed through the server configuration and authorised accounts.</p>{!data ? <p className="loading-panel">Loading staff…</p> : <DataTable headers={["Name", "Email", "Role", "Access", "Agent profile"]} rows={data.items.map((item) => [item.name, item.email, item.role, item.active ? "Active" : "Disabled", item.agent ? item.agent.published ? "Published" : "Unpublished" : "No profile"])} />}</>;
}

function SettingsAdmin({ onError }: { onError: (message: string) => void }) {
  const { data } = useLoad<{ email: string; notifyEmail: string; vaultre: { configured: boolean; writesEnabled: boolean }; fixtures: string; siteUrl: string }>("/api/admin/settings", onError);
  const [probe, setProbe] = useState("");
  async function checkVaultre() {
    try {
      const result = await request<{ configured: boolean; writesEnabled: boolean; reason?: string }>("/api/admin/integrations/vaultre/probe", { method: "POST" });
      setProbe(result.configured ? `VaultRE connection check: ${result.reason ?? "complete"}.` : "VaultRE credentials are not configured.");
    } catch (reason) { setProbe(reason instanceof Error ? reason.message : "Could not check VaultRE."); }
  }
  return <><h2>Settings &amp; integrations</h2>{data ? <div className="settings-list"><p><strong>Public site:</strong> {data.siteUrl}</p><p><strong>Email:</strong> {data.email} · Notification address {data.notifyEmail}</p><p><strong>VaultRE:</strong> {data.vaultre.configured ? "Configured" : "Not configured"} · writes {data.vaultre.writesEnabled ? "enabled" : "disabled"}</p><p><strong>Fixture records:</strong> {data.fixtures}</p></div> : <p className="loading-panel">Loading settings…</p>}<button className="button-secondary" type="button" onClick={() => void checkVaultre()}>Check VaultRE connection</button>{probe && <p role="status">{probe}</p>}<p className="notice">Credentials are never shown here. Set or rotate them through the server environment, not this browser.</p></>;
}

function ReportsAdmin({ onError }: { onError: (message: string) => void }) {
  const { data } = useLoad<{ leads: Array<{ status: string; _count: { _all: number } }>; bookings: Array<{ status: string; _count: { _all: number } }>; listings: Array<{ status: string; _count: { _all: number } }> }>("/api/admin/reports", onError);
  const reports = data ? [{ title: "Enquiries", rows: data.leads }, { title: "Bookings", rows: data.bookings }, { title: "Properties", rows: data.listings }] : [];
  return <><h2>Reports</h2>{!data ? <p className="loading-panel">Loading reports…</p> : <div className="report-grid">{reports.map(({ title, rows }) => <section key={title}><h3>{title}</h3><DataTable headers={["Status", "Count"]} rows={rows.map((row) => [row.status.replaceAll("_", " "), row._count._all])} /></section>)}</div>}<a className="button-link" href="/api/admin/reports/enquiries.csv" download>Export enquiries CSV <span aria-hidden="true">↗</span></a></>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
