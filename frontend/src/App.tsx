import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Property from "./pages/Property";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import {
  BookingPage,
  ContentPage,
  TeamPage,
  TestimonialsPage,
} from "./pages/ContentPages";
import Admin from "./pages/Admin";

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const moreMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
    moreMenu.current?.removeAttribute("open");
    const titles: Record<string, string> = {
      "/": "V Group Real Estate | Melbourne and Victoria",
      "/buy": "Buy property | V Group Real Estate",
      "/rent": "Rent property | V Group Real Estate",
      "/commercial": "Commercial property | V Group Real Estate",
      "/land": "Land | V Group Real Estate",
      "/portfolio": "Property portfolio | V Group Real Estate",
      "/sell": "Sell with us | V Group Real Estate",
      "/lease": "Lease with us | V Group Real Estate",
      "/about": "About V Group | V Group Real Estate",
      "/services": "Our services | V Group Real Estate",
      "/team": "Our team | V Group Real Estate",
      "/testimonials": "Client testimonials | V Group Real Estate",
      "/contact": "Contact V Group | V Group Real Estate",
      "/book-inspection": "Request an inspection | V Group Real Estate",
      "/book-consultation": "Request a consultation | V Group Real Estate",
      "/privacy": "Privacy | V Group Real Estate",
      "/terms": "Terms | V Group Real Estate",
      "/cookies": "Cookie information | V Group Real Estate",
      "/ai-disclosure": "AI disclosure | V Group Real Estate",
    };
    document.title = titles[location.pathname] ?? (location.pathname.startsWith("/property/") ? "Property details | V Group Real Estate" : location.pathname.startsWith("/admin") ? "Staff sign in | V Group Real Estate" : "V Group Real Estate | Melbourne and Victoria");
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.head.appendChild(Object.assign(document.createElement("link"), { rel: "canonical" }));
    canonical.href = `https://vgrouprealestate.com.au${location.pathname}`;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]') ?? document.head.appendChild(Object.assign(document.createElement("meta"), { name: "robots" }));
    robots.content = location.pathname.startsWith("/admin") ? "noindex,nofollow" : "index,follow";
  }, [location.pathname]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className={`bar${isHome ? " bar-home" : ""}`}>
        <Link to="/" className="brand" aria-label="V Group Real Estate home">
          <span className="brand-word">V<span className="brand-mark">/</span>GROUP</span>
          <span className="brand-caption">REAL ESTATE · VICTORIA</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"} <span aria-hidden="true">{menuOpen ? "−" : "+"}</span>
        </button>
        <nav id="primary-navigation" className={menuOpen ? "nav-open" : ""} aria-label="Main navigation">
          <NavLink to="/buy">Buy</NavLink>
          <NavLink to="/rent">Rent</NavLink>
          <NavLink to="/commercial">Commercial</NavLink>
          <NavLink to="/land">Land</NavLink>
          <NavLink to="/portfolio">Portfolio</NavLink>
          <details className="nav-more" ref={moreMenu}>
            <summary>Discover <span aria-hidden="true">⌄</span></summary>
            <div className="nav-more-menu">
              <Link to="/sell">Sell with us</Link>
              <Link to="/lease">Lease with us</Link>
              <Link to="/about">About V Group</Link>
              <Link to="/services">Our services</Link>
              <Link to="/team">Our team</Link>
              <Link to="/testimonials">Testimonials</Link>
            </div>
          </details>
          <Link className="nav-contact" to="/contact">Speak with us <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>
      <main id="main">
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buy" element={<Search title="Find a home to buy" type="SALE" />} />
            <Route path="/rent" element={<Search title="Find a place to rent" type="RENT" />} />
            <Route path="/commercial" element={<Search title="Commercial property" category="COMMERCIAL" />} />
            <Route path="/land" element={<Search title="Land for sale" category="LAND" />} />
            <Route path="/portfolio" element={<Search title="Our property portfolio" view="portfolio" />} />
            <Route path="/property/:slug" element={<Property />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sell" element={<ContentPage pageKey="sell" />} />
            <Route path="/lease" element={<ContentPage pageKey="lease" />} />
            <Route path="/about" element={<ContentPage pageKey="about" />} />
            <Route path="/services" element={<ContentPage pageKey="services" />} />
            <Route path="/privacy" element={<ContentPage pageKey="privacy" />} />
            <Route path="/terms" element={<ContentPage pageKey="terms" />} />
            <Route path="/cookies" element={<ContentPage pageKey="cookies" />} />
            <Route path="/ai-disclosure" element={<ContentPage pageKey="ai" />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/book-inspection" element={<BookingPage kind="INSPECTION" />} />
            <Route path="/book-consultation" element={<BookingPage kind="CONSULTATION" />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <footer className="site-footer">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link to="/" className="footer-brand">V/GROUP <span>REAL ESTATE</span></Link>
            <p>Thoughtful property across Melbourne and Victoria.</p>
            <Link className="light-link" to="/contact">Start a conversation <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="site-footer-links">
            <div><span className="footer-heading">Explore</span><Link to="/buy">Buy</Link><Link to="/rent">Rent</Link><Link to="/commercial">Commercial</Link><Link to="/land">Land</Link><Link to="/portfolio">Portfolio</Link></div>
            <div><span className="footer-heading">V Group</span><Link to="/about">About</Link><Link to="/services">Services</Link><Link to="/sell">Sell with us</Link><Link to="/lease">Lease with us</Link><Link to="/team">Our team</Link></div>
            <div><span className="footer-heading">Information</span><Link to="/contact">Contact</Link><Link to="/book-inspection">Book an inspection</Link><Link to="/book-consultation">Book a consultation</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cookies">Cookies</Link><Link to="/ai-disclosure">AI disclosure</Link></div>
          </div>
        </div>
        <div className="site-footer-bottom"><span>© {new Date().getFullYear()} V Group Real Estate</span><span>Melbourne · Victoria · Australia</span><Link to="/admin">Staff sign in</Link></div>
      </footer>
    </>
  );
}
