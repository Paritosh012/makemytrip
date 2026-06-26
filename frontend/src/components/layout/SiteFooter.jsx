import { Link } from "react-router-dom";
import { IconPlane, IconStore, IconArrowRight } from "../Icons";

const Social = ({ children, label }) => (
  <a href="#" aria-label={label} onClick={(e) => e.preventDefault()}>
    {children}
  </a>
);

const SiteFooter = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div className="brand">
            <div className="site-logo">
              <span className="mark"><IconPlane /></span>
              Travel SaaS
            </div>
            <p>
              Handpicked travel experiences, booked directly with trusted local
              agencies. Fewer middlemen, fairer prices, real journeys.
            </p>
            <div className="socials">
              <Social label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.3 8.3L23 22h-6.8l-5.3-6.9L4.8 22H1.7l7.8-8.9L1 2h7l4.8 6.3L18.9 2Zm-2.4 18h1.9L7.6 4H5.6l10.9 16Z"/></svg>
              </Social>
              <Social label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </Social>
              <Social label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.3 8.5h3.3V21H3.3V8.5Zm5.6 0h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.3 0 3.9 2.17 3.9 5V21h-3.3v-5.8c0-1.38-.02-3.16-1.93-3.16-1.93 0-2.22 1.5-2.22 3.06V21H8.9V8.5Z"/></svg>
              </Social>
            </div>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#" onClick={(e) => e.preventDefault()}>About us</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Careers</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Travel blog</a></li>
              <li><a href="/#reviews">Traveler stories</a></li>
            </ul>
          </div>

          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Help center</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Contact us</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Cancellation policy</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Payment & refunds</a></li>
            </ul>
          </div>

          <div>
            <h4>For partners</h4>
            <ul>
              <li>
                <Link to="/apply-host" className="host-cta">
                  <IconStore style={{ width: 16, height: 16 }} />
                  Become a Host
                  <IconArrowRight style={{ width: 15, height: 15 }} />
                </Link>
              </li>
              <li><Link to="/login">Partner login</Link></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>List your packages</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Partner support</a></li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Travel SaaS Travel. All rights reserved.</span>
          <span style={{ display: "flex", gap: 18 }}>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Cookies</a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
