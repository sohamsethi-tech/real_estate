import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Reveal from "../components/Reveal";
import PropertyCollections, { HomeHighlights } from "../components/PropertyCollections";

export default function Home() {
  const navigate = useNavigate();
  const [suburb, setSuburb] = useState("");
  const [intent, setIntent] = useState("buy");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (suburb.trim()) params.set("suburb", suburb.trim());
    navigate(`/${intent}${params.size ? `?${params}` : ""}`);
  }

  return (
    <>
      <section className="hero-screen">
        <img className="hero-photo" src="/images/victorian-residence.jpg" alt="Editorial photograph of a contemporary Australian residence" width={2400} height={1592} fetchPriority="high" decoding="async" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> A DIFFERENT PERSPECTIVE ON PROPERTY</p>
          <h1>Find a place<br />to <em>belong.</em></h1>
          <p className="hero-intro">Considered guidance for the places, spaces and next chapters that matter.</p>
          <a className="hero-discover" href="#our-approach">Discover V Group <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-footnote"><span>INDEPENDENT, LOCALLY CONNECTED</span><span>MELBOURNE &amp; VICTORIA</span></div>
        <span className="hero-image-note">EDITORIAL PROPERTY PHOTOGRAPHY</span>
      </section>

      <section className="search-dock" aria-label="Property search">
        <div className="search-dock-label"><span className="eyebrow">YOUR NEXT MOVE</span><span>Start with a place in mind.</span></div>
        <form onSubmit={search} role="search" aria-label="Search properties">
          <label>
            <span>Looking to</span>
            <select value={intent} onChange={(event) => setIntent(event.target.value)}>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </label>
          <label>
            <span>Suburb</span>
            <input value={suburb} onChange={(event) => setSuburb(event.target.value)} placeholder="Any suburb" />
          </label>
          <button type="submit">Explore properties <span aria-hidden="true">↗</span></button>
        </form>
      </section>

      <section id="our-approach" className="editorial-intro">
        <Reveal className="intro-index"><span>V/G — 01</span><span>OUR APPROACH</span></Reveal>
        <Reveal className="intro-statement">
          <p className="eyebrow"><span className="eyebrow-line" /> PROPERTY, WITH PERSPECTIVE</p>
          <h2>More than an address.<br /><em>A feeling of home.</em></h2>
        </Reveal>
        <Reveal className="intro-copy">
          <p>Every move is personal. It deserves more than a search result: local insight, honest advice and someone in your corner from the first viewing to the next chapter.</p>
          <Link className="text-link" to="/contact">Meet your local team <span aria-hidden="true">↗</span></Link>
        </Reveal>
      </section>

      <section className="architecture-story">
        <div className="story-photo story-photo-large">
          <img src="/images/architecture-detail.jpg" alt="Editorial view of a contemporary residence framed by warm timber and glass" width={1800} height={1224} loading="lazy" decoding="async" />
          <span className="image-credit">THE ART OF ARRIVING · EDITORIAL</span>
        </div>
        <Reveal className="story-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> THE V GROUP POINT OF VIEW</p>
          <span className="story-number">01 — PLACE</span>
          <h2>Good places<br />change how<br /><em>life feels.</em></h2>
          <p>From a quiet street in the inner north to a little more room beyond the city, we believe the right place is about how you want to live.</p>
          <Link className="text-link" to="/buy">Explore homes for sale <span aria-hidden="true">↗</span></Link>
        </Reveal>
        <div className="story-photo story-photo-detail">
          <img src="/images/courtyard.jpg" alt="Sunlit courtyard opening to a quiet, contemporary home" width={1800} height={1200} loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="editorial-interlude">
        <img src="/images/terrace.jpg" alt="Editorial view of a modern home opening onto a leafy terrace" width={1800} height={1200} loading="lazy" decoding="async" />
        <div className="interlude-shade" />
        <Reveal className="interlude-copy">
          <p className="eyebrow eyebrow-light">ROOM TO LIVE YOUR WAY</p>
          <h2>Make space<br />for <em>what’s next.</em></h2>
          <Link to="/rent" className="light-link">Find a place to rent <span aria-hidden="true">↗</span></Link>
        </Reveal>
        <span className="interlude-caption">A HOME IS MADE IN THE MOMENTS WITHIN IT.</span>
      </section>

      <section className="discovery-section">
        <Reveal className="discovery-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> FIND YOUR WAY</p>
          <h2>A considered<br /><em>search starts here.</em></h2>
          <p>Thoughtful guidance, wherever your property journey leads.</p>
        </Reveal>
        <div className="discovery-links">
          <Link to="/buy"><span className="discovery-number">01</span><span className="discovery-title">Find a home</span><span className="discovery-desc">For sale across Melbourne &amp; Victoria</span><span className="discovery-arrow">↗</span></Link>
          <Link to="/rent"><span className="discovery-number">02</span><span className="discovery-title">Find a rental</span><span className="discovery-desc">Places to make your own</span><span className="discovery-arrow">↗</span></Link>
          <Link to="/commercial"><span className="discovery-number">03</span><span className="discovery-title">Commercial</span><span className="discovery-desc">Space for your next idea</span><span className="discovery-arrow">↗</span></Link>
          <Link to="/land"><span className="discovery-number">04</span><span className="discovery-title">Find land</span><span className="discovery-desc">Room for a new beginning</span><span className="discovery-arrow">↗</span></Link>
        </div>
      </section>

      <PropertyCollections />

      <section className="home-about">
        <div className="home-about-image"><img src="/images/victorian-residence.jpg" alt="A considered Melbourne residence" width={2400} height={1592} loading="lazy" decoding="async" /></div>
        <Reveal className="home-about-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A DIFFERENT PERSPECTIVE</p>
          <h2>Property is<br /><em>personal.</em></h2>
          <p>Every move has its own questions. We take the time to understand what matters to you, then help you make the next decision with clarity.</p>
          <Link className="text-link" to="/about">Get to know V Group <span aria-hidden="true">↗</span></Link>
        </Reveal>
      </section>

      <HomeHighlights />

      <section className="home-services">
        <div><p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> HERE FOR YOUR NEXT CHAPTER</p><h2>Whatever the move,<br /><em>let’s make it considered.</em></h2></div>
        <div className="home-services-links"><Link to="/sell">Thinking of selling? <span>Talk to us ↗</span></Link><Link to="/lease">Leasing a property? <span>Start here ↗</span></Link><Link to="/book-consultation">Need a conversation? <span>Book a time ↗</span></Link></div>
      </section>

      <section className="closing-story">
        <img src="/images/quiet-interior.jpg" alt="Soft morning light falling across a considered living space" width={1800} height={1200} loading="lazy" decoding="async" />
        <Reveal className="closing-copy">
          <span className="eyebrow eyebrow-light">HERE FOR THE WHOLE JOURNEY</span>
          <h2>Let’s find<br />your <em>somewhere.</em></h2>
          <Link className="light-link" to="/contact">Start a conversation <span aria-hidden="true">↗</span></Link>
        </Reveal>
      </section>
    </>
  );
}
