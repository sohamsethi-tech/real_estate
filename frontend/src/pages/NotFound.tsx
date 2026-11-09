import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found-page">
      <img src="/images/architecture-detail.jpg" alt="" />
      <div className="not-found-shade" />
      <div className="not-found-copy">
        <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> V/G — 404</p>
        <h1>This path<br />ends <em>here.</em></h1>
        <p>Let’s find another way to your next place.</p>
        <div><Link className="light-link" to="/buy">Explore properties <span aria-hidden="true">↗</span></Link><Link className="light-link" to="/contact">Speak with us <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
  );
}
