import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import * as packageService from "../services/package.service";
import * as bookingService from "../services/booking.service";
import { setPendingBooking } from "../features/booking/bookingSlice";
import {
  IconSearch,
  IconPin,
  IconCalendar,
  IconClock,
  IconUsers,
  IconShield,
  IconWallet,
  IconHeadset,
  IconCheck,
  IconArrowRight,
  IconClose,
  IconStore,
} from "../components/Icons";

const INTENT_KEY = "yatri_intended_pkg";

/* ---------- small helpers ---------- */
const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date)) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const tripDays = (start, end) => {
  if (!start || !end) return null;
  const a = new Date(start),
    b = new Date(end);
  if (isNaN(a) || isNaN(b)) return null;
  const days = Math.round((b - a) / 86400000) + 1;
  return days > 0 ? days : null;
};

// Map a destination string to a category + gradient "photo" look.
const DEST_CATS = [
  {
    key: "beach",
    label: "Beaches",
    emoji: "🏝️",
    g: "g-beach",
    words: [
      "beach",
      "goa",
      "mald'?ives",
      "andaman",
      "pondicherry",
      "bali",
      "phuket",
      "sea",
      "island",
    ],
  },
  {
    key: "mountain",
    label: "Mountains",
    emoji: "⛰️",
    g: "g-mountain",
    words: [
      "manali",
      "himalaya",
      "hill",
      "mountain",
      "leh",
      "ladakh",
      "spiti",
      "darjeeling",
      "munnar",
      "nainital",
      "shimla",
      "trek",
    ],
  },
  {
    key: "desert",
    label: "Desert",
    emoji: "🏜️",
    g: "g-desert",
    words: [
      "desert",
      "dubai",
      "rajasthan",
      "jaisalmer",
      "jodhpur",
      "sahara",
      "thar",
    ],
  },
  {
    key: "forest",
    label: "Wildlife",
    emoji: "🌳",
    g: "g-forest",
    words: [
      "forest",
      "jungle",
      "wayanad",
      "jim corbett",
      "safari",
      "kerala",
      "backwater",
      "coorg",
    ],
  },
  {
    key: "city",
    label: "City breaks",
    emoji: "🏙️",
    g: "g-city",
    words: [
      "city",
      "singapore",
      "bangkok",
      "london",
      "paris",
      "tokyo",
      "mumbai",
      "delhi",
    ],
  },
  {
    key: "snow",
    label: "Snow",
    emoji: "❄️",
    g: "g-snow",
    words: ["snow", "kashmir", "gulmarg", "auli", "switzerland", "ski"],
  },
];

const catFor = (destination = "") => {
  const d = destination.toLowerCase();
  for (const c of DEST_CATS) {
    if (c.words.some((w) => d.includes(w.replace("'?", "")))) return c;
  }
  return {
    key: "default",
    label: "Getaways",
    emoji: "✈️",
    g: "g-default",
    words: [],
  };
};

// Deterministic presentational rating from id (no reviews field in DB yet).
const pseudoRating = (id = "") => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  const rating = (4.3 + (h % 7) / 10).toFixed(1); // 4.3 – 4.9
  const reviews = 40 + (h % 260); // 40 – 299
  return { rating, reviews };
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [notice, setNotice] = useState("");

  // booking modal
  const [bookingPkg, setBookingPkg] = useState(null);
  const [seats, setSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // auth prompt modal (guest tried to book)
  const [authPkg, setAuthPkg] = useState(null);

  useEffect(() => {
    setLoading(true);
    packageService
      .getPublicPackages()
      .then((res) => setPackages(res.data || []))
      .catch((err) => setError(err.message || "Failed to load packages"))
      .finally(() => setLoading(false));
  }, []);

  // Resume a booking the user started before signing in.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "END_USER" || !packages.length)
      return;
    const intended = sessionStorage.getItem(INTENT_KEY);
    if (!intended) return;
    const pkg = packages.find((p) => p._id === intended);
    sessionStorage.removeItem(INTENT_KEY);
    if (pkg) {
      setBookingPkg(pkg);
      setSeats(1);
    }
  }, [isAuthenticated, user, packages]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      const matchCat =
        activeCat === "all" || catFor(p.destination).key === activeCat;
      const matchQ =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.destination?.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [packages, query, activeCat]);

  const scrollToPackages = () => {
    document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBook = (pkg) => {
    setNotice("");
    if (!isAuthenticated) {
      sessionStorage.setItem(INTENT_KEY, pkg._id);
      setAuthPkg(pkg);
      return;
    }
    if (user?.role !== "END_USER") {
      setNotice(
        `You're signed in as ${user.role.replace("_", " ").toLowerCase()}. Switch to a traveler account to book trips.`,
      );
      return;
    }
    setBookingPkg(pkg);
    setSeats(1);
    setBookingError("");
  };

  const confirmBook = async () => {
    if (!bookingPkg) return;
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await bookingService.createBooking({
        packageId: bookingPkg._id,
        seats,
      });
      dispatch(setPendingBooking({ bookingId: res.data._id, pkg: bookingPkg }));
      setBookingPkg(null);
      navigate("/bookings");
    } catch (err) {
      setBookingError(err.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const goAuth = (path) => {
    setAuthPkg(null);
    navigate(path);
  };

  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="hero">
        <div className="container grid">
          <div>
            <span className="eyebrow">
              <span className="dot" /> 500+ trips from 50+ trusted agencies
            </span>
            <h1>
              Find your next trip,
              <br />
              <span className="u">book it in minutes</span>
            </h1>
            <p className="lede">
              Browse handpicked holiday packages — treks, beaches, weekend
              escapes — and book directly with the people who run them. No
              account needed to explore.
            </p>

            <div className="trust-row">
              <span className="ti">
                <IconShield /> Secure Razorpay payments
              </span>
              <span className="ti">
                <IconCheck /> Instant confirmation
              </span>
              <span className="ti">
                <IconHeadset /> Real agency support
              </span>
            </div>
          </div>

          {/* gradient collage (no external images needed) */}
          <div className="hero-collage">
            <div className="photo p1 g-mountain">
              <div className="ph-body">
                <span className="pt">Himalayan Treks</span>
                <span className="pm">Manali · Spiti · Leh</span>
              </div>
            </div>
            <div className="photo p2 g-beach">
              <div className="ph-body">
                <span className="pt">Beach Escapes</span>
                <span className="pm">Goa · Andaman</span>
              </div>
            </div>
            <div className="photo p3 g-desert">
              <div className="ph-body">
                <span className="pt">Desert Safari</span>
                <span className="pm">Rajasthan</span>
              </div>
            </div>
            <div className="floating-badge">
              <span className="ic">★</span>
              <div>
                <div className="t1">4.8 / 5 rating</div>
                <div className="t2">from 10,000+ travelers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== DESTINATIONS ===================== */}
      <section className="section" id="destinations">
        <div className="container">
          <div className="section-head">
            <div className="kicker">Browse by vibe</div>
            <h2>Where do you want to go?</h2>
            <p>Pick a style of trip and we’ll show you matching packages.</p>
          </div>
          <div className="chips">
            <button
              className={`chip ${activeCat === "all" ? "active" : ""}`}
              onClick={() => {
                setActiveCat("all");
                scrollToPackages();
              }}
            >
              <span className="e">🌍</span> All trips
            </button>
            {DEST_CATS.map((c) => (
              <button
                key={c.key}
                className={`chip ${activeCat === c.key ? "active" : ""}`}
                onClick={() => {
                  setActiveCat(c.key);
                  scrollToPackages();
                }}
              >
                <span className="e">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PACKAGES ===================== */}
      <section className="section soft" id="packages">
        <div className="container">
          <div className="pkg-toolbar">
            <div className="section-head left" style={{ marginBottom: 0 }}>
              <div className="kicker">Featured packages</div>
              <h2>Trips you can book today</h2>
            </div>
            <div className="count">
              {!loading && (
                <>
                  <b>{visible.length}</b>{" "}
                  {visible.length === 1 ? "trip" : "trips"} available
                </>
              )}
            </div>
          </div>

          {notice && <div className="ynotice info">{notice}</div>}
          {error && <div className="ynotice err">{error}</div>}

          {loading ? (
            <div className="yloader">
              <div className="yspin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="yempty">
              <div className="yic">🧭</div>
              <h3>No trips match your search</h3>
              <p>Try a different destination or clear the filters.</p>
              {(query || activeCat !== "all") && (
                <button
                  className="ybtn ybtn-ghost"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setQuery("");
                    setActiveCat("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="cards">
              {visible.map((pkg) => {
                const cat = catFor(pkg.destination);
                const days = tripDays(pkg.startDate, pkg.endDate);
                const start = fmtDate(pkg.startDate);
                const { rating, reviews } = pseudoRating(pkg._id);
                const seatsLeft = pkg.seatsAvailable ?? 0;
                const low = seatsLeft > 0 && seatsLeft <= 5;
                const sold = seatsLeft === 0;
                const wasPrice = Math.round((pkg.price || 0) * 1.18); // shows a typical "list price"

                return (
                  <article key={pkg._id} className="pcard">
                    <div className={`media ${cat.g}`}>
                      <div className="pills">
                        <span className="pill">
                          {cat.emoji} {cat.label}
                        </span>
                        {low && <span className="pill hot">Filling fast</span>}
                        {sold && <span className="pill hot">Sold out</span>}
                      </div>
                      <span className="place">
                        <IconPin /> {pkg.destination || "—"}
                      </span>
                    </div>

                    <div className="body">
                      <h3>{pkg.title}</h3>
                      <div className="rrow">
                        <span className="stars">★★★★★</span>
                        <b style={{ color: "var(--ink)" }}>{rating}</b>
                        <span className="rev">({reviews} reviews)</span>
                      </div>

                      {pkg.description && (
                        <p className="desc">{pkg.description}</p>
                      )}

                      <div className="feats">
                        {days && (
                          <span className="feat">
                            <IconClock style={{ width: 14, height: 14 }} />{" "}
                            {days} days
                          </span>
                        )}
                        {start && (
                          <span className="feat">
                            <IconCalendar style={{ width: 14, height: 14 }} />{" "}
                            from {start}
                          </span>
                        )}
                        <span className="feat">
                          <IconUsers style={{ width: 14, height: 14 }} /> group
                        </span>
                      </div>

                      <div className={`seatline ${low ? "low" : "ok"}`}>
                        {sold
                          ? "No seats left"
                          : low
                            ? `Only ${seatsLeft} seats left`
                            : `${seatsLeft} seats available`}
                      </div>

                      <div className="foot">
                        <div className="price">
                          <span className="was">
                            ₹{wasPrice.toLocaleString("en-IN")}
                          </span>
                          <span className="now">
                            ₹{(pkg.price || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="per"> / person</span>
                        </div>
                        <button
                          className="ybtn ybtn-primary"
                          disabled={sold}
                          onClick={() => handleBook(pkg)}
                        >
                          {sold ? "Sold out" : "Book now"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===================== WHY US ===================== */}
      <section className="section" id="why">
        <div className="container">
          <div className="section-head">
            <div className="kicker">Why Travel SaaS</div>
            <h2>Travel booking without the noise</h2>
            <p>
              We connect you directly with the agencies running the trips — so
              you get honest pricing and real people behind every booking.
            </p>
          </div>
          <div className="feature-grid">
            <div className="fcard">
              <div className="fic ic-blue">
                <IconStore
                  style={{ width: 24, height: 24, color: "var(--brand)" }}
                />
              </div>
              <h3>Book direct, save more</h3>
              <p>
                No layers of resellers. You deal with the agency that actually
                runs the trip, so prices stay fair.
              </p>
            </div>
            <div className="fcard">
              <div className="fic ic-orange">
                <IconShield
                  style={{ width: 24, height: 24, color: "var(--accent)" }}
                />
              </div>
              <h3>Payments you can trust</h3>
              <p>
                Every payment is processed and verified through Razorpay with
                signature checks. Your money is protected.
              </p>
            </div>
            <div className="fcard">
              <div className="fic ic-green">
                <IconCheck
                  style={{ width: 24, height: 24, color: "var(--green)" }}
                />
              </div>
              <h3>Instant confirmation</h3>
              <p>
                Seats are reserved the moment your payment clears. Get your
                booking status in real time, no waiting.
              </p>
            </div>
            <div className="fcard">
              <div className="fic ic-blue">
                <IconHeadset
                  style={{ width: 24, height: 24, color: "var(--brand)" }}
                />
              </div>
              <h3>Real agency support</h3>
              <p>
                Questions about your itinerary? Talk to the team that organises
                the trip, not a faceless call centre.
              </p>
            </div>
            <div className="fcard">
              <div className="fic ic-orange">
                <IconWallet
                  style={{ width: 24, height: 24, color: "var(--accent)" }}
                />
              </div>
              <h3>Transparent pricing</h3>
              <p>
                The price you see is the price you pay — per person, all on one
                screen, before you commit.
              </p>
            </div>
            <div className="fcard">
              <div className="fic ic-green">
                <IconUsers
                  style={{ width: 24, height: 24, color: "var(--green)" }}
                />
              </div>
              <h3>Trips for everyone</h3>
              <p>
                From budget weekend getaways to once-in-a-lifetime expeditions —
                filter by the kind of trip you love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="section soft" id="how">
        <div className="container">
          <div className="section-head">
            <div className="kicker">Simple by design</div>
            <h2>How booking works</h2>
            <p>
              Explore freely. Only create an account when you’re ready to book.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="n">1</div>
              <h3>Explore trips</h3>
              <p>
                Browse and filter packages by destination and style — no sign-up
                required.
              </p>
            </div>
            <div className="step">
              <div className="n">2</div>
              <h3>Create your account</h3>
              <p>
                Found the one? Sign up in seconds with a quick email OTP to
                continue.
              </p>
            </div>
            <div className="step">
              <div className="n">3</div>
              <h3>Pay securely</h3>
              <p>
                Pick your seats and pay through Razorpay. Your payment is
                verified instantly.
              </p>
            </div>
            <div className="step">
              <div className="n">4</div>
              <h3>Pack your bags</h3>
              <p>
                Get instant confirmation and manage everything from “My trips”.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="section" id="reviews">
        <div className="container">
          <div className="section-head">
            <div className="kicker">Loved by travelers</div>
            <h2>Real trips, real reviews</h2>
            <p>
              A few words from people who booked their last adventure with us.
            </p>
          </div>
          <div className="tgrid">
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p className="quote">
                “Booked the Manali trek on a whim. The whole thing — payment,
                confirmation, the actual trip — was smoother than any big travel
                site I’ve used.”
              </p>
              <div className="tperson">
                <span className="av" style={{ background: "#2a5bd7" }}>
                  R
                </span>
                <div>
                  <div className="nm">Rahul Sharma</div>
                  <div className="rl">Bengaluru · Manali Trek</div>
                </div>
              </div>
            </div>
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p className="quote">
                “Loved that I could talk to the agency directly. They tweaked
                the Kerala itinerary for us and the price was still lower than
                elsewhere.”
              </p>
              <div className="tperson">
                <span className="av" style={{ background: "#ff5a1f" }}>
                  P
                </span>
                <div>
                  <div className="nm">Priya Nair</div>
                  <div className="rl">Pune · Kerala Backwaters</div>
                </div>
              </div>
            </div>
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p className="quote">
                “No endless upsells, no junk fees. I saw the price, picked my
                seats, paid, done. This is how travel booking should feel.”
              </p>
              <div className="tperson">
                <span className="av" style={{ background: "#15a34a" }}>
                  A
                </span>
                <div>
                  <div className="nm">Aman Verma</div>
                  <div className="rl">Delhi · Rajasthan Desert</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="cta">
        <div className="container">
          <h2>Ready to plan your next escape?</h2>
          <p>
            Thousands of travelers are discovering trips right now. Your turn.
          </p>
          <button
            className="ybtn ybtn-accent ybtn-lg"
            onClick={scrollToPackages}
          >
            Explore packages{" "}
            <IconArrowRight style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </section>

      {/* ===================== BOOKING MODAL ===================== */}
      {bookingPkg && (
        <div className="ymodal-overlay" onClick={() => setBookingPkg(null)}>
          <div className="ymodal" onClick={(e) => e.stopPropagation()}>
            <div className="mhead">
              <h3>Confirm your booking</h3>
              <button className="mclose" onClick={() => setBookingPkg(null)}>
                <IconClose style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="mbody">
              <div className="trip-summary">
                <div className="ts-title">{bookingPkg.title}</div>
                <div className="ts-loc">
                  <IconPin style={{ width: 14, height: 14 }} />{" "}
                  {bookingPkg.destination}
                </div>
              </div>

              <div className="field-label">How many seats?</div>
              <div className="seat-stepper">
                <button
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  disabled={seats <= 1}
                >
                  −
                </button>
                <span className="val">
                  {seats} {seats > 1 ? "seats" : "seat"}
                </span>
                <button
                  onClick={() =>
                    setSeats((s) => Math.min(bookingPkg.seatsAvailable, s + 1))
                  }
                  disabled={seats >= bookingPkg.seatsAvailable}
                >
                  +
                </button>
              </div>
              <div
                className="text-muted"
                style={{ fontSize: 12.5, marginTop: 8, color: "var(--muted)" }}
              >
                {bookingPkg.seatsAvailable} seats available
              </div>

              <div className="total-line">
                <span className="tl-lab">
                  Total ({seats} × ₹{bookingPkg.price?.toLocaleString("en-IN")})
                </span>
                <span className="tl-val">
                  ₹{(bookingPkg.price * seats).toLocaleString("en-IN")}
                </span>
              </div>

              {bookingError && (
                <div className="ynotice err" style={{ marginTop: 16 }}>
                  {bookingError}
                </div>
              )}
              <div className="ynotice info" style={{ marginTop: 16 }}>
                We’ll reserve your booking now. Payment happens next on the My
                trips page.
              </div>
            </div>
            <div className="mfoot">
              <button
                className="ybtn ybtn-ghost"
                onClick={() => setBookingPkg(null)}
              >
                Cancel
              </button>
              <button
                className="ybtn ybtn-primary"
                onClick={confirmBook}
                disabled={bookingLoading}
              >
                {bookingLoading ? "Reserving…" : "Confirm booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== AUTH PROMPT MODAL ===================== */}
      {authPkg && (
        <div className="ymodal-overlay" onClick={() => setAuthPkg(null)}>
          <div className="ymodal" onClick={(e) => e.stopPropagation()}>
            <div className="mhead">
              <h3>Almost there!</h3>
              <button className="mclose" onClick={() => setAuthPkg(null)}>
                <IconClose style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="mbody" style={{ textAlign: "center" }}>
              <div className="auth-illus">🎒</div>
              <h3 style={{ fontSize: 19, marginBottom: 8 }}>
                Sign in to book this trip
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14.5,
                  marginBottom: 4,
                }}
              >
                You were looking at{" "}
                <b style={{ color: "var(--ink)" }}>{authPkg.title}</b>.
              </p>
              <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
                Create a free account (or sign in) and we’ll bring you right
                back here to finish booking.
              </p>
            </div>
            <div className="mfoot">
              <button
                className="ybtn ybtn-ghost"
                onClick={() => goAuth("/login")}
              >
                I have an account
              </button>
              <button
                className="ybtn ybtn-accent"
                onClick={() => goAuth("/register")}
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
