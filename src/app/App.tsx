import { useState, useEffect, useRef, Fragment, useCallback } from "react";
import { Heart, X, ChevronRight, Star, Film, Play, Check, Users, Loader2, Search, LogOut } from "lucide-react";
import { useRoom } from "@/lib/RoomContext";
import { RoomCreationDialog } from "@/app/components/RoomCreationDialog";
import { RoomScreen } from "@/app/components/RoomScreen";
import { AuthModal } from "@/app/components/AuthModal";
import { fetchTrendingMovies, fetchMoviesByGenre, searchMovies } from "@/lib/tmdb";
import { getCurrentUser, logoutUser } from "@/lib/api";
import type { Movie, User } from "../../shared/types";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const CAROUSEL_MOVIE_COUNT = 10;

const SWIPE_MOVIES = [
  { id: 1, title: "Dune: Part Two",        genre: "Sci-Fi · Adventure", year: 2024, rating: 8.6, matchPct: 92, img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=380&h=540&fit=crop&auto=format", tags: ["Epic", "Visually Stunning", "Sci-Fi"] },
  { id: 2, title: "Oppenheimer",            genre: "Drama · History",    year: 2023, rating: 8.9, matchPct: 87, img: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=380&h=540&fit=crop&auto=format", tags: ["Intense", "Award-Winning"] },
  { id: 3, title: "Past Lives",             genre: "Drama · Romance",    year: 2023, rating: 7.9, matchPct: 78, img: "https://images.unsplash.com/photo-1518708909080-704599b19972?w=380&h=540&fit=crop&auto=format", tags: ["Emotional", "Beautiful"] },
  { id: 4, title: "The Batman",             genre: "Action · Thriller",  year: 2022, rating: 7.8, matchPct: 81, img: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=380&h=540&fit=crop&auto=format", tags: ["Dark", "Gritty"] },
  { id: 5, title: "Everything Everywhere", genre: "Comedy · Sci-Fi",    year: 2022, rating: 8.0, matchPct: 89, img: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=380&h=540&fit=crop&auto=format", tags: ["Weird", "Heartwarming"] },
];

const FRIENDS = [
  { name: "Alex",   color: "#E50914", angle: -75 },
  { name: "Jordan", color: "#E50914", angle: -15 },
  { name: "Sam",    color: "#3B82F6", angle:  45 },
  { name: "Riley",  color: "#F97316", angle: 105 },
  { name: "Casey",  color: "#E50914", angle: 165 },
  { name: "Morgan", color: "#EAB308", angle: 225 },
];

const STREAMING = [
  { name: "Netflix",     color: "#E50914", letter: "N" },
  { name: "Prime Video", color: "#00A8E1", letter: "P" },
  { name: "Disney+",     color: "#0063E5", letter: "D+" },
  { name: "Apple TV+",   color: "#999",    letter: "tv" },
  { name: "YouTube",     color: "#FF0000", letter: "▶" },
];

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────

const STYLES = `
  @keyframes float-a {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes float-b {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }
  @keyframes float-c {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes particle-rise {
    0%   { transform: translateY(0)   scale(1); opacity: 1; }
    100% { transform: translateY(-160px) scale(0); opacity: 0; }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0   rgba(229,9,20,0.6); }
    100% { box-shadow: 0 0 0 20px rgba(229,9,20,0);   }
  }
  @keyframes dot-travel {
    0%   { offset-distance: 0%;   opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { offset-distance: 100%; opacity: 0; }
  }
  @keyframes shimmer-slide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(400%);  }
  }
  @keyframes swipe-card-enter {
    0%   { opacity: 0; transform: translateY(18px) scale(0.96); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fade-in {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes modal-pop {
    0%   { opacity: 0; transform: translateY(16px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .spin { animation: spin 0.9s linear infinite; }

  @keyframes carousel-glow-pulse {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 0.7; }
  }
  .carousel-wrapper {
    perspective: 1200px;
    perspective-origin: 50% 50%;
  }
  .carousel-ring {
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .carousel-card {
    position: absolute;
    backface-visibility: hidden;
    transition: filter 0.5s ease, opacity 0.5s ease, box-shadow 0.4s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1);
    cursor: pointer;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: #0c0c12;
  }
  .carousel-card:hover {
    z-index: 100 !important;
    box-shadow: 0 50px 100px rgba(0,0,0,0.8), 0 0 80px rgba(229,9,20,0.45), inset 0 0 0 1px rgba(255,255,255,0.12) !important;
  }
  .carousel-card .card-overlay {
    transition: opacity 0.35s ease;
  }
  .carousel-card:hover .card-overlay {
    opacity: 1 !important;
  }

  .hiw-flow { display: flex; align-items: stretch; }
  .hiw-card { flex: 1 1 0; min-width: 0; }
  .hiw-arrow { flex: 0 0 64px; display: flex; align-items: center; justify-content: center; color: #E50914; }
  @media (max-width: 880px) {
    .hiw-flow { flex-direction: column; align-items: stretch; }
    .hiw-arrow { flex: 0 0 52px; transform: rotate(90deg); }
  }

  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .d1 { transition-delay: 0.10s; }
  .d2 { transition-delay: 0.20s; }
  .d3 { transition-delay: 0.30s; }
  .d4 { transition-delay: 0.40s; }
  .d5 { transition-delay: 0.55s; }

  .grad-vp {
    background: linear-gradient(135deg, #ffe5e5 0%, #E50914 38%, #B20710 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .grad-bv {
    background: linear-gradient(135deg, #f7b6ba 0%, #B20710 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
  }
  ::-webkit-scrollbar { width: 0; height: 0; }
  html { scroll-behavior: smooth; }
`;

// ─────────────────────────────────────────────
// GRAIN OVERLAY
// ─────────────────────────────────────────────

function Grain() {
  return (
    <>
      <svg style={{ display: "none" }}>
        <filter id="cm-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div style={{ position: "fixed", inset: 0, filter: "url(#cm-grain)", opacity: 0.032, pointerEvents: "none", zIndex: 9999, background: "white" }} />
    </>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────

function Navbar({ scrolled, onStartMatching, onOpenSearch, onJoinRoom, onSeeHowItWorks, onOpenAuth, user, onLogOut }: { scrolled: boolean; onStartMatching: () => void; onOpenSearch: () => void; onJoinRoom: () => void; onSeeHowItWorks: () => void; onOpenAuth: () => void; user: { displayName: string; email: string; provider?: string } | null; onLogOut: () => void; }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      transition: "background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
      background: scrolled ? "rgba(8,8,9,0.9)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(229,9,20,0.12)" : "1px solid transparent",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#B20710,#E50914)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(229,9,20,0.45)" }}>
            <Film size={15} color="white" />
          </div>
          <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
            Cine<span className="grad-vp">Match</span>
          </span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden md:flex">
          {["Discover", "How It Works", "Features"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 500, color: "rgba(240,239,250,0.5)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EFFA")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,250,0.5)")}
              onClick={e => { e.preventDefault(); l === "How It Works" && onSeeHowItWorks(); }}>{l}</a>
          ))}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 600, color: "white" }}
                onMouseEnter={e => {
                  const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                  if (dropdown) dropdown.style.display = "block";
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#B20710,#E50914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                {user.displayName}
              </button>
              <div
                style={{
                  display: "none", position: "absolute", top: "100%", right: 0, marginTop: 8,
                  background: "rgba(10,10,14,0.95)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "8px 0", minWidth: 160,
                  boxShadow: "0 10px 32px rgba(0,0,0,0.8)", backdropFilter: "blur(16px)"
                }}
                onMouseLeave={e => { e.currentTarget.style.display = "none"; }}
                onMouseEnter={e => { e.currentTarget.style.display = "block"; }}
              >
                <button style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", color: "rgba(240,239,250,0.8)", textAlign: "left", fontFamily: "Inter,sans-serif", fontSize: 14, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>Profile</button>
                <button onClick={onLogOut} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ff8b94", textAlign: "left", fontFamily: "Inter,sans-serif", fontSize: 14, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(229,9,20,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>Log Out</button>
              </div>
            </div>
          ) : (
            <a href="#" style={{ fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 500, color: "rgba(240,239,250,0.5)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EFFA")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,250,0.5)")}
              onClick={e => { e.preventDefault(); onOpenAuth(); }}
            >Log In</a>
          )}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onOpenSearch}
            aria-label="Search movies"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(240,239,250,0.7)", cursor: "pointer", transition: "background 0.2s, border-color 0.2s, color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(229,9,20,0.4)"; e.currentTarget.style.color = "#F0EFFA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(240,239,250,0.7)"; }}
          >
            <Search size={17} />
          </button>
          <button
            onClick={onJoinRoom}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(240,239,250,0.78)", fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s, border-color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(229,9,20,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
          >
            Join
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#B20710,#E50914)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 0 16px rgba(229,9,20,0.18), 0 8px 24px rgba(0,0,0,0.2)", transition: "transform 0.25s, box-shadow 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(229,9,20,0.25), 0 10px 26px rgba(0,0,0,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(229,9,20,0.18), 0 8px 24px rgba(0,0,0,0.2)"; }}
            onClick={onStartMatching}
          >
            Start Matching <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function MovieCarousel3D({ onSelectMovie }: { onSelectMovie: (m: Movie) => void }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rotationRef = useRef(0);

  useEffect(() => {
    fetchTrendingMovies("week").then((m) => {
      if (m && m.length >= CAROUSEL_MOVIE_COUNT) {
        setMovies(m.slice(0, CAROUSEL_MOVIE_COUNT));
      } else if (m && m.length > 0) {
        setMovies(m);
      }
    });
  }, []);

  // Continuous auto-rotation
  useEffect(() => {
    const speed = 0.012; // degrees per ms
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      if (!isPaused) {
        rotationRef.current = (rotationRef.current + speed * dt) % 360;
        setRotation(rotationRef.current);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPaused]);

  if (movies.length === 0) {
    // Loading shimmer placeholder
    return (
      <div style={{ width: 500, height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 200, height: 300, borderRadius: 20, background: "linear-gradient(135deg, rgba(229,9,20,0.08), rgba(255,255,255,0.03))", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", animation: "shimmer-slide 1.8s infinite" }} />
        </div>
      </div>
    );
  }

  const count = movies.length;
  const cardW = 200;
  const cardH = 300;
  // Radius of the carousel ring — fits cards nicely
  const radius = Math.max(320, (cardW * count) / (2 * Math.PI) + 40);
  const angleStep = 360 / count;

  return (
    <div
      className="carousel-wrapper"
      style={{ position: "relative", width: 500, height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => { setIsPaused(false); setHoveredIdx(null); }}
    >
      {/* Ambient glow behind carousel */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 420, height: 420, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(229,9,20,0.15) 0%, rgba(178,7,16,0.08) 40%, transparent 70%)",
        filter: "blur(60px)",
        animation: "carousel-glow-pulse 4s ease-in-out infinite",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* 3D Ring */}
      <div
        className="carousel-ring"
        style={{
          position: "relative",
          width: cardW, height: cardH,
          transformStyle: "preserve-3d",
          transform: `rotateY(${-rotation}deg)`,
        }}
      >
        {movies.map((movie, i) => {
          const angle = i * angleStep;
          // Calculate if this card is facing the viewer
          const cardAngle = ((angle + rotation) % 360 + 360) % 360;
          const isFront = cardAngle < 60 || cardAngle > 300;
          const isBack = cardAngle > 120 && cardAngle < 240;
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={movie.id}
              className="carousel-card"
              onClick={() => onSelectMovie(movie)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: "absolute",
                width: cardW, height: cardH,
                left: 0, top: 0,
                transform: `rotateY(${angle}deg) translateZ(${radius}px)${isHovered ? " scale(1.12)" : ""}`,
                boxShadow: isFront
                  ? "0 30px 70px rgba(0,0,0,0.7), 0 0 50px rgba(229,9,20,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)"
                  : "0 16px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)",
                zIndex: isFront ? 10 : isBack ? 1 : 5,
              }}
            >
              <img
                src={movie.img}
                alt={movie.title}
                draggable={false}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  transition: "transform 0.45s ease",
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              />

              {/* Dark gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 35%, transparent 60%)",
              }} />

              {/* Movie info overlay */}
              <div
                className="card-overlay"
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "16px 14px 14px",
                }}
              >
                <h3 style={{
                  fontFamily: "Manrope,sans-serif", fontWeight: 800,
                  fontSize: isHovered ? 17 : 15, lineHeight: 1.2,
                  letterSpacing: "-0.02em", color: "white",
                  margin: "0 0 4px",
                  transition: "font-size 0.3s ease",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}>{movie.title}</h3>
                <p style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: 11, color: "rgba(255,255,255,0.55)",
                  margin: "0 0 8px",
                }}>{movie.genre}{movie.year ? ` · ${movie.year}` : ""}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {typeof movie.rating === "number" && movie.rating > 0 ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 7px", borderRadius: 50,
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 10, fontWeight: 700, fontFamily: "Inter,sans-serif",
                    }}>
                      <Star size={9} fill="#F59E0B" color="#F59E0B" /> {movie.rating.toFixed(1)}
                    </span>
                  ) : null}
                  {typeof movie.matchPct === "number" ? (
                    <span style={{
                      padding: "2px 7px", borderRadius: 50,
                      background: "rgba(229,9,20,0.2)",
                      color: "#E50914", fontSize: 10, fontWeight: 700, fontFamily: "Inter,sans-serif",
                    }}>{movie.matchPct}% match</span>
                  ) : null}
                </div>
              </div>

              {/* Shine effect on hover */}
              {isHovered && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 20,
                  border: "1.5px solid rgba(229,9,20,0.5)",
                  boxShadow: "inset 0 0 24px rgba(229,9,20,0.15)",
                  pointerEvents: "none",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating label */}
      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        padding: "6px 16px", borderRadius: 50,
        background: "rgba(229,9,20,0.1)",
        border: "1px solid rgba(229,9,20,0.25)",
        fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 600,
        color: "rgba(229,9,20,0.7)", letterSpacing: "0.04em",
        pointerEvents: "none",
        opacity: isPaused ? 0 : 0.7,
        transition: "opacity 0.4s ease",
      }}>
        🎬 Trending Now
      </div>
    </div>
  );
}

function MovieDetailModal({ movie, onClose, onStartMatching }: { movie: Movie | null; onClose: () => void; onStartMatching: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!movie) return null;

  const hasMeta = movie.year || movie.rating;
  const backdrop = movie.backdropImg || movie.img;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.74)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", animation: "fade-in 0.2s ease" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 760, maxHeight: "88vh", overflowY: "auto", borderRadius: 24, background: "#0c0c0f", border: "1px solid rgba(229,9,20,0.25)", boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(229,9,20,0.12)", animation: "modal-pop 0.26s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Backdrop */}
        <div style={{ position: "relative", height: 240, backgroundImage: `url(${backdrop})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0c0c0f 6%, rgba(12,12,15,0.35) 55%, rgba(12,12,15,0.15))" }} />
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(12,12,15,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#F0EFFA", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,9,20,0.4)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(12,12,15,0.6)")}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 32px 32px" }}>
          <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: "-0.02em", margin: 0 }}>{movie.title}</h3>

          {hasMeta && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 12, fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(240,239,250,0.6)" }}>
              {movie.year ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{movie.year}</span> : null}
              {typeof movie.rating === "number" && movie.rating > 0 ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#F59E0B", fontWeight: 700 }}>
                  <Star size={14} fill="#F59E0B" color="#F59E0B" /> {movie.rating.toFixed(1)}
                </span>
              ) : null}
              {movie.genre ? <span style={{ color: "rgba(229,9,20,0.85)", fontWeight: 600 }}>{movie.genre}</span> : null}
              {typeof movie.matchPct === "number" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#10B981", fontWeight: 700 }}>✓ {movie.matchPct}% match</span>
              ) : null}
            </div>
          )}

          {movie.overview ? (
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 15, lineHeight: 1.65, color: "rgba(240,239,250,0.72)", margin: "20px 0 0" }}>{movie.overview}</p>
          ) : (
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, lineHeight: 1.65, color: "rgba(240,239,250,0.4)", margin: "20px 0 0", fontStyle: "italic" }}>No description available.</p>
          )}

          {movie.tags && movie.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
              {movie.tags.map((t, i) => (
                <span key={i} style={{ padding: "6px 14px", borderRadius: 50, background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.28)", color: "#f7b6ba", fontSize: 12, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>{t}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
            <button
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#B20710,#E50914)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 36px rgba(229,9,20,0.4), 0 10px 40px rgba(0,0,0,0.4)", transition: "transform 0.25s, box-shadow 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 52px rgba(229,9,20,0.7), 0 16px 48px rgba(0,0,0,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(229,9,20,0.4), 0 10px 40px rgba(0,0,0,0.4)"; }}
              onClick={() => { onClose(); onStartMatching(); }}
            >
              Start Matching <ChevronRight size={18} />
            </button>
            <button
              style={{ display: "flex", alignItems: "center", padding: "14px 28px", borderRadius: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,239,250,0.78)", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.25s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovieSearchModal({ onClose, onSelectMovie }: { onClose: () => void; onSelectMovie: (m: Movie) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchMovies(query).then((movies) => {
        setResults(movies);
        setHasSearched(true);
        setLoading(false);
      });
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 24px 48px", animation: "fade-in 0.2s ease" }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 860 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(229,9,20,0.28)", boxShadow: "0 0 32px rgba(229,9,20,0.15)" }}>
          <Search size={18} color="rgba(240,239,250,0.5)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a movie..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontFamily: "Inter,sans-serif", fontSize: 17 }}
            onKeyDown={e => e.key === "Escape" && onClose()}
          />
          {query && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} style={{ background: "transparent", border: "none", color: "rgba(240,239,250,0.4)", cursor: "pointer", display: "flex" }}>
              <X size={18} />
            </button>
          )}
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(240,239,250,0.4)", cursor: "pointer", display: "flex" }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={{ marginTop: 28, maxHeight: "64vh", overflowY: "auto" }}>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0", color: "rgba(240,239,250,0.5)" }}>
              <Loader2 size={28} className="spin" />
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <p style={{ textAlign: "center", color: "rgba(240,239,250,0.4)", fontFamily: "Inter,sans-serif", marginTop: 40 }}>No movies found for “{query}”.</p>
          )}

          {!hasSearched && !loading && (
            <p style={{ textAlign: "center", color: "rgba(240,239,250,0.32)", fontFamily: "Inter,sans-serif", marginTop: 40 }}>Start typing to search millions of movies.</p>
          )}

          {results.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 18 }}>
              {results.map((m) => (
                <div
                  key={m.id}
                  onClick={() => { onSelectMovie(m); onClose(); }}
                  style={{ cursor: "pointer", borderRadius: 14, overflow: "hidden", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(229,9,20,0.5)"; e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.55), 0 0 24px rgba(229,9,20,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ position: "relative", aspectRatio: "2 / 3", background: "#1a0a2e" }}>
                    <img src={m.img} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 10px" }}>
                      <p style={{ color: "white", fontSize: 13, fontWeight: 700, fontFamily: "Manrope,sans-serif", margin: 0, lineHeight: 1.2 }}>{m.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "Inter,sans-serif", margin: "3px 0 0" }}>
                        {m.year || ""}{typeof m.rating === "number" && m.rating > 0 ? ` · ★ ${m.rating.toFixed(1)}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({ onStartMatching, onExploreMovies, onSelectMovie }: { onStartMatching: () => void; onExploreMovies: () => void; onSelectMovie: (m: Movie) => void }) {
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: `radial-gradient(ellipse 90% 80% at 68% 50%, rgba(229,9,20,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 12% 85%, rgba(136,19,55,0.05) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 88% 8%, rgba(229,9,20,0.03) 0%, transparent 45%), #050505` }}>
      {/* Background lights */}
      <div style={{ position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "3%", bottom: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(178,7,16,0.04) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px 48px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 64, alignItems: "center" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <h1 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 1.04, letterSpacing: "-0.03em", margin: 0 }}>
              Find the movie{" "}
              <span className="grad-vp" style={{ display: "block" }}>everyone wants</span>
              to watch.
            </h1>

            <p className="reveal d2" style={{ fontFamily: "Inter,sans-serif", fontSize: "clamp(16px, 1.5vw, 19px)", color: "rgba(240,239,250,0.52)", lineHeight: 1.65, margin: 0, maxWidth: 460 }}>
              Stop scrolling. Start matching. Discover movies that you and your friends actually agree on.
            </p>

            <div className="reveal d3" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 28px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#B20710,#E50914)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 36px rgba(229,9,20,0.45), 0 10px 40px rgba(0,0,0,0.4)", transition: "transform 0.25s, box-shadow 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 52px rgba(229,9,20,0.7), 0 16px 48px rgba(0,0,0,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(229,9,20,0.45), 0 10px 40px rgba(0,0,0,0.4)"; }}
                onClick={onStartMatching}>
                Start a Movie Night <ChevronRight size={18} />
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,239,250,0.78)", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.25s, border-color 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                onClick={onExploreMovies}>
                <Play size={15} /> Explore Movies
              </button>
            </div>
          </div>

          {/* Right — 3D Carousel */}
          <div className="reveal d2" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <MovieCarousel3D onSelectMovie={onSelectMovie} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────

function HowItWorks({ onStartMatching }: { onStartMatching: () => void }) {
  const steps = [
    { emoji: "🏠", num: "01", title: "Create Room",     desc: "Start a session and share a link. Your crew joins in seconds — no app download needed.",    color: "#E50914", cta: "Invite friends →" },
    { emoji: "👆", num: "02", title: "Everyone Swipes",  desc: "Each person swipes through curated picks. Like what excites you. Skip the rest. Fast.",       color: "#E50914", cta: "Swipe to match →" },
    { emoji: "🎉", num: "03", title: "Find Your Match",  desc: "CineMatch reveals the overlap — the one film the whole group actually wants to watch.",        color: "#B20710", cta: "4/4 MATCH!" },
  ];

  return (
    <section style={{ position: "relative", padding: "128px 0", background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229,9,20,0.06) 0%, transparent 60%), #06060A` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(229,9,20,0.32), transparent)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,9,20,0.7)", marginBottom: 16 }}>How It Works</p>
          <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", letterSpacing: "-0.025em", margin: 0 }}>
            Three steps to <span className="grad-vp">movie night bliss</span>
          </h2>
        </div>

        <div className="hiw-flow">
          {steps.map((s, i) => (
            <Fragment key={i}>
              <div className={`hiw-card reveal d${i + 1}`} style={{ position: "relative", padding: "34px 28px 30px", borderRadius: 22, background: "linear-gradient(180deg, rgba(20,20,20,0.96), rgba(10,10,10,0.96))", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 18px 48px rgba(0,0,0,0.32)", transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${s.color}55`; e.currentTarget.style.boxShadow = `0 22px 52px rgba(0,0,0,0.38), 0 0 0 1px ${s.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "0 18px 48px rgba(0,0,0,0.32)"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: s.color, margin: 0 }}>STEP {s.num}</p>
                  <div style={{ width: 32, height: 1, background: `linear-gradient(to right, ${s.color}, transparent)` }} />
                </div>
                <div style={{ width: 62, height: 62, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}33`, boxShadow: `inset 0 0 0 1px ${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 22 }}>{s.emoji}</div>
                <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 22, margin: "0 0 12px", letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 15, color: "rgba(240,239,250,0.56)", lineHeight: 1.7, margin: "0 0 22px" }}>{s.desc}</p>
                {s.cta === "Invite friends →" ? (
                  <button onClick={onStartMatching} style={{ display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 999, background: "rgba(229,9,20,0.09)", border: `1px solid ${s.color}55`, color: s.color, fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif", letterSpacing: "0.02em", cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(229,9,20,0.18)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(229,9,20,0.09)"}>{s.cta}</button>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}22`, color: s.color, fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif", letterSpacing: "0.02em" }}>{s.cta}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="hiw-arrow" aria-hidden>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ width: 28, height: 1, background: "linear-gradient(to right, rgba(229,9,20,0.08), rgba(229,9,20,0.6))" }} />
                    <ChevronRight size={22} />
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Match moment */}
        <div className="reveal d4" style={{ marginTop: 64, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "20px 32px", borderRadius: 20, background: "rgba(229,9,20,0.07)", border: "1px solid rgba(229,9,20,0.25)", boxShadow: "0 0 48px rgba(229,9,20,0.08)" }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, color: "#E50914", margin: "0 0 2px" }}>IT'S A MATCH!</p>
              <p style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 18, margin: 0 }}>4/4 Friends agree on <span style={{ color: "#E50914" }}>Dune: Part Two</span></p>
            </div>
            <div style={{ display: "flex", marginLeft: 8 }}>
              {["A","J","S","R"].map((l, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #06060A", background: `hsl(${i * 52 + 240},58%,44%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, marginLeft: i ? -8 : 0, zIndex: i, fontFamily: "Inter,sans-serif" }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// SWIPE DEMO
// ─────────────────────────────────────────────

function MatchCelebration({ movie, onReset }: { movie: Movie | (typeof SWIPE_MOVIES)[0]; onReset: () => void }) {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: 10 + (i / 28) * 80,
    color: `hsl(${(i * 25) + 240}, 80%, 68%)`,
    delay: i * 0.04,
    dur: 1.2 + (i % 5) * 0.2,
  }));

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      {/* Particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 20 }}>
        {particles.map(p => (
          <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: "50%", width: 8, height: 8, borderRadius: "50%", background: p.color, animation: `particle-rise ${p.dur}s ${p.delay}s ease forwards` }} />
        ))}
      </div>

      <div style={{ display: "inline-block", padding: "8px 24px", borderRadius: 50, background: "linear-gradient(135deg,#B20710,#E50914)", color: "white", fontSize: 13, fontWeight: 800, fontFamily: "Inter,sans-serif", letterSpacing: "0.05em", marginBottom: 32, boxShadow: "0 0 40px rgba(229,9,20,0.6)" }}>
        🎉 IT'S A MATCH!
      </div>

      <div style={{ position: "relative", width: 220, height: 310, margin: "0 auto 28px", borderRadius: 24, overflow: "hidden", boxShadow: "0 0 80px rgba(229,9,20,0.5), 0 32px 64px rgba(0,0,0,0.6)", animation: "pulse-ring 1.5s ease-out" }}>
        <img src={movie.img} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", background: "#1a0a2e" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
          <p style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 16, color: "white", margin: 0 }}>{movie.title}</p>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, border: "2px solid rgba(229,9,20,0.7)", boxShadow: "inset 0 0 32px rgba(229,9,20,0.2)" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        {["A","J","S","R"].map((l, i) => (
          <div key={i} style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", border: "2px solid #E50914", background: `hsl(${i*52+240},58%,44%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, marginLeft: i ? -10 : 0, zIndex: i, fontFamily: "Inter,sans-serif" }}>
            {l}
            <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#E50914", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={8} color="white" strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "Manrope,sans-serif", fontSize: 18, fontWeight: 800, color: "#E50914", margin: "0 0 6px" }}>4/4 friends matched!</p>
      <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, color: "rgba(240,239,250,0.4)", margin: "0 0 32px" }}>Everyone wants to watch {movie.title}</p>

      <button onClick={onReset} style={{ padding: "10px 24px", borderRadius: 50, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,239,250,0.65)", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
        Try Again →
      </button>
    </div>
  );
}

function SwipeDemo() {
  const [demoMovies, setDemoMovies] = useState<Movie[]>(SWIPE_MOVIES);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [matched, setMatched] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrendingMovies("week").then((movies) => {
      if (movies && movies.length >= 5) {
        setDemoMovies(movies.slice(0, 8));
      }
    });
  }, []);

  const swipe = (d: "left" | "right") => {
    if (dir || matched) return;
    setDir(d);
    setHintVisible(false);
    setTimeout(() => {
      const next = idx + 1;
      if (next >= demoMovies.length) {
        setMatched(true);
      } else {
        setIdx(next);
      }
      setDir(null);
      setDragX(0);
      setDragY(0);
    }, 360);
  };

  const reset = () => { setIdx(0); setDir(null); setMatched(false); setHintVisible(true); setDragX(0); setDragY(0); };

  const movie = demoMovies[Math.min(idx, demoMovies.length - 1)];
  const nextMovie = demoMovies[Math.min(idx + 1, demoMovies.length - 1)];
  const nextNextMovie = demoMovies[Math.min(idx + 2, demoMovies.length - 1)];

  const rotation = isDragging ? (dragX / 10) : dir === "right" ? 22 : dir === "left" ? -22 : 0;
  const translateX = isDragging ? dragX : dir === "right" ? 160 : dir === "left" ? -160 : 0;
  const translateY = isDragging ? dragY : 0;
  const opacity = isDragging ? Math.min(1, 1 - Math.abs(dragX) / 400) : 1;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (dir || matched) return;
    dragStartRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
    setDragX(0);
    setDragY(0);
  }, [dir, matched]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setDragX(dx);
    setDragY(dy);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragX) > 100) {
      swipe(dragX > 0 ? "right" : "left");
    } else {
      setDragX(0);
      setDragY(0);
    }
    dragStartRef.current = null;
  }, [isDragging, dragX, swipe]);

  return (
    <section style={{ padding: "128px 0", background: "#06060A", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(229,9,20,0.4), transparent)" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,9,20,0.7)", marginBottom: 16 }}>Try It</p>
          <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(30px,4vw,50px)", letterSpacing: "-0.025em", margin: "0 0 12px" }}>
            Swipe to find your <span className="grad-vp">perfect movie</span>
          </h2>
          <p className="reveal d2" style={{ fontFamily: "Inter,sans-serif", fontSize: 15, color: "rgba(240,239,250,0.42)", margin: 0 }}>❤️ Like or skip — see how fast you find a match</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
          {!matched ? (
            <>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {demoMovies.map((_, i) => (
                  <div key={i} style={{ height: 4, borderRadius: 2, transition: "all 0.4s ease", width: i === idx ? 24 : 8, background: i < idx ? "#E50914" : i === idx ? "#E50914" : "rgba(255,255,255,0.14)" }} />
                ))}
              </div>

              {/* Card stack */}
              <div style={{ position: "relative", width: 340, height: 480 }}>
                {/* Behind card 2 */}
                {nextNextMovie && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", width: 300, height: 430, marginLeft: -150, marginTop: -215, borderRadius: 22, overflow: "hidden", transform: "translateX(-110px) rotate(-12deg) scale(0.85)", zIndex: 1, boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 30px rgba(229,9,20,0.25)", border: "1px solid rgba(255,255,255,0.06)", background: "#0c0c12" }}>
                    <img src={nextNextMovie.img} alt={nextNextMovie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(229,9,20,0.2), rgba(178,7,16,0.3))", mixBlendMode: "overlay" }} />
                  </div>
                )}

                {/* Behind card 1 */}
                {nextMovie && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", width: 300, height: 430, marginLeft: -150, marginTop: -215, borderRadius: 22, overflow: "hidden", transform: "translateX(110px) rotate(12deg) scale(0.85)", zIndex: 2, boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 30px rgba(229,9,20,0.3)", border: "1px solid rgba(255,255,255,0.06)", background: "#0c0c12" }}>
                    <img src={nextMovie.img} alt={nextMovie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(229,9,20,0.2), rgba(178,7,16,0.3))", mixBlendMode: "overlay" }} />
                  </div>
                )}

                {/* Main card */}
                <div
                  ref={cardRef}
                  onMouseDown={e => handleStart(e.clientX, e.clientY)}
                  onMouseMove={e => { if (isDragging) handleMove(e.clientX, e.clientY); }}
                  onMouseUp={() => handleEnd()}
                  onMouseLeave={() => { if (isDragging) handleEnd(); }}
                  onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchEnd={() => handleEnd()}
                  style={{
                    position: "absolute", top: "50%", left: "50%", width: 300, height: 430, marginLeft: -150, marginTop: -215, borderRadius: 22, overflow: "hidden", zIndex: 5, cursor: "grab", background: "#1a0a2e",
                    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${isDragging ? 1.02 : 1})`,
                    transition: isDragging ? "none" : dir ? "transform 0.48s cubic-bezier(0.25,0.46,0.45,0.94)" : "transform 0.48s cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 60px rgba(229,9,20,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)`,
                    opacity,
                    userSelect: "none",
                    touchAction: "none",
                  }}
                >
                  <img src={movie.img} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.2) 35%, transparent 60%)" }} />

                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 28px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {movie.tags?.map(t => (
                        <span key={t} style={{ padding: "4px 12px", borderRadius: 50, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>{t}</span>
                      ))}
                    </div>
                    <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 26, color: "white", margin: "0 0 6px", letterSpacing: "-0.02em" }}>{movie.title}</h3>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, color: "rgba(255,255,255,0.55)", margin: "0 0 14px" }}>{movie.genre} · {movie.year}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Star size={15} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 700 }}>{movie.rating}</span>
                      </div>
                      <div style={{ padding: "4px 12px", borderRadius: 50, background: "rgba(229,9,20,0.18)", color: "#E50914", fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{movie.matchPct}% match</div>
                    </div>
                  </div>

                  {/* Swipe indicators */}
                  {dir === "right" && (
                    <div style={{ position: "absolute", top: 28, left: 24, padding: "10px 18px", borderRadius: 14, background: "rgba(229,9,20,0.2)", border: "2px solid #E50914", color: "#E50914", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 22, transform: "rotate(-10deg)" }}>LIKE ❤️</div>
                  )}
                  {dir === "left" && (
                    <div style={{ position: "absolute", top: 28, right: 24, padding: "10px 18px", borderRadius: 14, background: "rgba(229,9,20,0.2)", border: "2px solid #E50914", color: "#E50914", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 22, transform: "rotate(10deg)" }}>SKIP ✕</div>
                  )}
                  {isDragging && (
                    <div style={{ position: "absolute", top: 28, left: dragX > 40 ? 24 : "auto", right: dragX < -40 ? 24 : "auto", padding: "10px 18px", borderRadius: 14, background: dragX > 0 ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.1)", border: `2px solid ${dragX > 0 ? "#E50914" : "rgba(255,255,255,0.3)"}`, color: dragX > 0 ? "#E50914" : "rgba(255,255,255,0.8)", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 22, transform: `rotate(${dragX > 0 ? -10 : 10}deg)` }}>
                      {dragX > 0 ? "LIKE ❤️" : "SKIP ✕"}
                    </div>
                  )}
                </div>
              </div>

              {/* Hint */}
              {hintVisible && (
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(240,239,250,0.28)", margin: 0 }}>← Skip · Like →</p>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <button onClick={() => swipe("left")} disabled={!!dir || isDragging} style={{ width: 76, height: 76, borderRadius: "50%", border: "1px solid rgba(229,9,20,0.3)", background: "rgba(229,9,20,0.09)", color: "#E50914", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s, transform 0.2s, box-shadow 0.2s", boxShadow: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(229,9,20,0.18)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(229,9,20,0.09)"; e.currentTarget.style.transform = "scale(1)"; }}>
                  <X size={32} />
                </button>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, color: "rgba(255,255,255,0.28)", width: 60, textAlign: "center", margin: 0 }}>{idx + 1} / {demoMovies.length}</p>
                <button onClick={() => swipe("right")} disabled={!!dir || isDragging} style={{ width: 76, height: 76, borderRadius: "50%", border: "1px solid rgba(229,9,20,0.35)", background: "rgba(229,9,20,0.1)", color: "#E50914", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s, transform 0.2s, box-shadow 0.2s", boxShadow: "0 0 24px rgba(229,9,20,0.2)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(229,9,20,0.2)"; e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(229,9,20,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(229,9,20,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(229,9,20,0.2)"; }}>
                  <Heart size={32} />
                </button>
              </div>
            </>
          ) : (
            <MatchCelebration movie={movie} onReset={reset} />
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FRIENDS SECTION
// ─────────────────────────────────────────────

function Friends() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.25 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const R = 168, cx = 260, cy = 240;

  return (
    <section style={{ padding: "128px 0", position: "relative", background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(229,9,20,0.05) 0%, transparent 70%), #06060A` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(229,9,20,0.45), transparent)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 80, alignItems: "center" }}>

          {/* Text */}
          <div>
            <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,9,20,0.7)", marginBottom: 20 }}>Social Matching</p>
            <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", lineHeight: 1.12, letterSpacing: "-0.025em", margin: "0 0 24px" }}>
              Your taste.{" "}
              <span className="grad-vp">Their taste.</span>
              {" "}One movie.
            </h2>
            <p className="reveal d2" style={{ fontFamily: "Inter,sans-serif", fontSize: 16, color: "rgba(240,239,250,0.5)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 440 }}>
              CineMatch analyzes everyone's swipes in real-time and finds the perfect overlap — the movie that genuinely excites the whole group.
            </p>

            <div className="reveal d3" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
              {[
                { e: "🎯", t: "Smart taste matching across the whole group" },
                { e: "⚡", t: "Real-time swipes, instant results" },
                { e: "🌍", t: "Watch together or each from your couch" },
              ].map(item => (
                <div key={item.t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{item.e}</span>
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: 14, color: "rgba(240,239,250,0.62)", margin: 0 }}>{item.t}</p>
                </div>
              ))}
            </div>

            <div className="reveal d4" style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 24px", borderRadius: 18, background: "rgba(229,9,20,0.07)", border: "1px solid rgba(229,9,20,0.25)" }}>
              <div style={{ display: "flex" }}>
                {["A","J","S","R"].map((l, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(229,9,20,0.5)", background: `hsl(${i*52+240},58%,44%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginLeft: i ? -7 : 0, zIndex: i, fontFamily: "Inter,sans-serif" }}>{l}</div>
                ))}
              </div>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 20, color: "#E50914" }}>4/4 MATCH</span>
              <span style={{ fontSize: 22 }}>🎉</span>
            </div>
          </div>

          {/* Diagram */}
          <div ref={ref} className="reveal d2" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 520, height: 480 }}>
              {/* SVG lines */}
              <svg width="520" height="480" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <defs>
                  {FRIENDS.map(f => (
                    <linearGradient key={f.name} id={`lg-${f.name}`} gradientUnits="userSpaceOnUse"
                      x1={cx} y1={cy}
                      x2={cx + R * Math.cos((f.angle * Math.PI) / 180)}
                      y2={cy + R * Math.sin((f.angle * Math.PI) / 180)}>
                      <stop offset="0%" stopColor={f.color} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={f.color} stopOpacity="0.25" />
                    </linearGradient>
                  ))}
                </defs>
                {FRIENDS.map((f, i) => {
                  const a = (f.angle * Math.PI) / 180;
                  const fx = cx + R * Math.cos(a);
                  const fy = cy + R * Math.sin(a);
                  return (
                    <g key={f.name}>
                      <line x1={cx} y1={cy} x2={fx} y2={fy} stroke={`url(#lg-${f.name})`} strokeWidth="1.5" strokeDasharray="6 4"
                        style={{ opacity: visible ? 1 : 0, transition: `opacity 0.8s ${i * 0.12}s ease` }} />
                      {visible && (
                        <circle r="3.5" fill={f.color} opacity="0.85">
                          <animateMotion dur={`${2.2 + i * 0.25}s`} repeatCount="indefinite" path={`M ${cx},${cy} L ${fx},${fy}`} />
                          <animate attributeName="opacity" values="0;1;1;0" dur={`${2.2 + i * 0.25}s`} repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Center movie */}
              <div style={{ position: "absolute", left: cx - 52, top: cy - 72, width: 104, height: 144, borderRadius: 16, overflow: "hidden", zIndex: 10, boxShadow: "0 0 48px rgba(229,9,20,0.55), 0 16px 40px rgba(0,0,0,0.55)", border: "2px solid rgba(229,9,20,0.55)", animation: visible ? "pulse-ring 2s ease-out infinite" : "none" }}>
                <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=104&h=144&fit=crop&auto=format" alt="Dune" style={{ width: "100%", height: "100%", objectFit: "cover", background: "#1a0a2e" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />
                <p style={{ position: "absolute", bottom: 6, left: 4, right: 4, textAlign: "center", fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 8, color: "white" }}>Dune: Part Two</p>
              </div>

              {/* Friend avatars */}
              {FRIENDS.map((f, i) => {
                const a = (f.angle * Math.PI) / 180;
                const fx = cx + R * Math.cos(a);
                const fy = cy + R * Math.sin(a);
                return (
                  <div key={f.name} style={{ position: "absolute", left: fx - 22, top: fy - 22, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: visible ? 1 : 0, transition: `opacity 0.6s ${i * 0.1 + 0.4}s ease` }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${f.color}`, background: `${f.color}18`, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: "Inter,sans-serif" }}>
                      {f.name[0]}
                    </div>
                    <div style={{ padding: "2px 6px", borderRadius: 50, background: `${f.color}18`, color: f.color, fontSize: 8, fontWeight: 700, fontFamily: "Inter,sans-serif", whiteSpace: "nowrap", marginTop: 2 }}>
                      ❤️ liked
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PICK YOUR VIBE
// ─────────────────────────────────────────────

function VibePicker({ onStartMatching, selectedGenre, onGenreSelect }: { onStartMatching: () => void; selectedGenre: string | null; onGenreSelect: (genre: string) => void }) {
  const VIBES = [
    { emoji: "😂", label: "Comedy" },
    { emoji: "👻", label: "Horror" },
    { emoji: "❤️", label: "Romance" },
    { emoji: "🔥", label: "Action" },
    { emoji: "🧠", label: "Thriller" },
    { emoji: "🚀", label: "Sci-Fi" },
  ];

  return (
    <div id="vibe-section" style={{ flex: "1 1 400px", minWidth: 300, padding: "36px 32px", borderRadius: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
      <h2 className="reveal" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(26px,3.5vw,40px)", letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        Pick your <span className="grad-vp">vibe.</span>
      </h2>
      <p className="reveal d1" style={{ fontFamily: "Inter,sans-serif", fontSize: "clamp(15px,2vw,18px)", color: "rgba(240,239,250,0.5)", margin: "0 0 32px" }}>
        Tonight's mood?
      </p>

      <div className="reveal d2" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {VIBES.map((v) => {
          const isSel = selectedGenre === v.label;
          return (
            <button
              key={v.label}
              onClick={() => onGenreSelect(v.label)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
              onMouseEnter={e => { if (!isSel) { const box = e.currentTarget.firstElementChild as HTMLElement; const lbl = e.currentTarget.lastElementChild as HTMLElement; box.style.borderColor = "rgba(229,9,20,0.4)"; box.style.boxShadow = "0 0 18px rgba(229,9,20,0.35)"; lbl.style.color = "#F0EFFA"; } }}
              onMouseLeave={e => { if (!isSel) { const box = e.currentTarget.firstElementChild as HTMLElement; const lbl = e.currentTarget.lastElementChild as HTMLElement; box.style.borderColor = "rgba(255,255,255,0.1)"; box.style.boxShadow = "none"; lbl.style.color = "rgba(240,239,250,0.6)"; } }}
            >
              <div style={{ width: 62, height: 62, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, background: isSel ? "linear-gradient(135deg,#B20710,#E50914)" : "rgba(255,255,255,0.04)", border: `1px solid ${isSel ? "transparent" : "rgba(255,255,255,0.1)"}`, boxShadow: isSel ? "0 0 24px rgba(229,9,20,0.45), 0 8px 20px rgba(0,0,0,0.3)" : "none", transition: "all 0.25s ease" }}>
                {v.emoji}
              </div>
              <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: isSel ? "#F0EFFA" : "rgba(240,239,250,0.6)", transition: "color 0.25s" }}>{v.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onStartMatching}
        disabled={!selectedGenre}
        style={{
          marginTop: 32, display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 26px", borderRadius: 50, border: "none",
          background: !selectedGenre ? "rgba(229,9,20,0.35)" : "linear-gradient(135deg,#B20710,#E50914)",
          color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700, cursor: !selectedGenre ? "default" : "pointer",
          boxShadow: !selectedGenre ? "none" : "0 0 32px rgba(229,9,20,0.45), 0 10px 30px rgba(0,0,0,0.3)",
          transition: "transform 0.25s, box-shadow 0.25s",
        }}
        onMouseEnter={e => { if (selectedGenre) { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(229,9,20,0.7), 0 16px 40px rgba(0,0,0,0.4)"; } }}
        onMouseLeave={e => { if (selectedGenre) { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(229,9,20,0.45), 0 10px 30px rgba(0,0,0,0.3)"; } }}
      >
        {selectedGenre ? `Start with ${selectedGenre} →` : "Pick a vibe to start"} <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// WHERE TO WATCH
// ─────────────────────────────────────────────

function WhereToWatch() {
  const [sel, setSel] = useState(0);

  return (
    <div style={{ flex: "1 1 400px", minWidth: 300, padding: "36px 32px", borderRadius: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>

        {/* Movie card */}
        <div className="reveal" style={{ position: "relative", width: 130, height: 190, borderRadius: 14, overflow: "hidden", flexShrink: 0, boxShadow: "0 0 40px rgba(59,130,246,0.18), 0 18px 38px rgba(0,0,0,0.6)", background: "#1a0a2e" }}>
          <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=130&h=190&fit=crop&auto=format" alt="Dune: Part Two" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 10px 10px" }}>
            <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 12, color: "white", margin: 0, letterSpacing: "-0.01em" }}>Dune: Part Two</h3>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 9, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>2024 · 2h 46m</p>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(59,130,246,0.7)", margin: "0 0 8px" }}>Streaming</p>
          <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(20px,2.6vw,28px)", letterSpacing: "-0.025em", margin: "0 0 16px" }}>
            Where can we <span className="grad-bv">watch it?</span>
          </h2>

          <div className="reveal d2" style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
            {STREAMING.map((s, i) => (
              <button key={s.name} onClick={() => setSel(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 50, border: `1px solid ${sel === i ? s.color + "55" : "rgba(255,255,255,0.08)"}`, background: sel === i ? `${s.color}18` : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.3s", boxShadow: sel === i ? `0 0 18px ${s.color}28` : "none" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 6, fontWeight: 900, fontFamily: "Manrope,sans-serif" }}>{s.letter}</div>
                <span style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 600, color: sel === i ? s.color : "rgba(240,239,250,0.55)", transition: "color 0.3s" }}>{s.name}</span>
                {sel === i && <Check size={11} color={s.color} />}
              </button>
            ))}
          </div>

          <button onClick={() => setSel(sel)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 50, border: "none", background: STREAMING[sel].color, color: "white", fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 22px ${STREAMING[sel].color}55`, transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px) scale(1.02)"; e.currentTarget.style.boxShadow = `0 0 34px ${STREAMING[sel].color}88`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = `0 0 22px ${STREAMING[sel].color}55`; }}>
            Watch on {STREAMING[sel].name} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────

function CTA({ onStartMatching, onSeeHowItWorks }: { onStartMatching: () => void; onSeeHowItWorks: () => void }) {
  return (
    <section style={{ position: "relative", padding: "160px 0", overflow: "hidden" }}>
      {/* Blurred poster bg */}
      <div style={{ position: "absolute", inset: 0 }}>
        <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop&auto=format" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(24px) brightness(0.18)", transform: "scale(1.1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #06060A 0%, rgba(6,6,10,0.35) 50%, #06060A 100%)" }} />
      </div>

      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(229,9,20,0.28) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 840, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <div className="reveal" style={{ display: "inline-block", padding: "8px 20px", borderRadius: 50, background: "rgba(229,9,20,0.14)", border: "1px solid rgba(229,9,20,0.32)", color: "#E50914", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", marginBottom: 32, boxShadow: "0 0 20px rgba(229,9,20,0.5)" }}>
          🎬 Free to start — no credit card needed
        </div>

        <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(42px,6vw,80px)", lineHeight: 1.04, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Stop scrolling.{" "}
          <span className="grad-vp">Start watching.</span>
        </h2>

        <p className="reveal d2" style={{ fontFamily: "Inter,sans-serif", fontSize: "clamp(17px,2vw,22px)", color: "rgba(240,239,250,0.48)", margin: "0 0 52px" }}>
          Your next movie night is one match away.
        </p>

        <div className="reveal d3" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 56 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 36px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#B20710,#E50914)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 56px rgba(229,9,20,0.65), 0 0 112px rgba(229,9,20,0.25), 0 20px 48px rgba(0,0,0,0.5)", transition: "transform 0.25s, box-shadow 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 72px rgba(229,9,20,0.8), 0 0 144px rgba(229,9,20,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 56px rgba(229,9,20,0.65), 0 0 112px rgba(229,9,20,0.25), 0 20px 48px rgba(0,0,0,0.5)"; }}
            onClick={onStartMatching}>
            Start Matching <ChevronRight size={20} />
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 32px", borderRadius: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,239,250,0.72)", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "background 0.25s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.11)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onClick={onSeeHowItWorks}>
            <Play size={16} /> See how it works
          </button>
        </div>

        <div className="reveal d4" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 28 }}>
          {["Create a room", "Invite friends", "Find your match"].map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(240,239,250,0.32)" }}>
              <span style={{ color: "#E50914", fontWeight: 700 }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ padding: "48px 24px", background: "#06060A", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#B20710,#E50914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={13} color="white" />
          </div>
          <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 16 }}>Cine<span className="grad-vp">Match</span></span>
        </div>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(240,239,250,0.22)", margin: 0 }}>© 2025 CineMatch. Made for movie lovers everywhere.</p>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(240,239,250,0.28)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EFFA")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,250,0.28)")}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────

export default function App() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [urlRoomId, setUrlRoomId] = useState<string | undefined>(undefined);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<{ displayName: string; email: string; provider?: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const { room: activeRoom, leaveRoom } = useRoom();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId) {
      setUrlRoomId(roomId);
      setShowRoomDialog(true);
    }
    const authStatus = params.get("auth");
    if (authStatus === "success") {
      getCurrentUser().then((u) => {
        if (u) setUser({ displayName: u.displayName, email: u.email });
      }).catch(() => {});
      window.history.replaceState({}, "", window.location.pathname);
    } else if (authStatus === "error") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUser({ displayName: u.displayName, email: u.email });
      setUserLoading(false);
    }).catch(() => {
      setUserLoading(false);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    const onMouse = (e: MouseEvent) => setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMouse); };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );
    const update = () => document.querySelectorAll(".reveal:not(.visible)").forEach(el => obs.observe(el));
    update();
    const timer = setTimeout(update, 500);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, []);

  const handleStartMatching = () => {
    setShowRoomDialog(true);
  };

  const handleSelectGenre = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleExploreMovies = () => {
    document.getElementById("vibe-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSeeHowItWorks = () => {
    document.getElementById("howitworks-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const closeRoomDialog = () => {
    setShowRoomDialog(false);
    setUrlRoomId(undefined);
  };

  const closeRoomScreen = () => {
    leaveRoom();
    setShowRoomDialog(false);
    setUrlRoomId(undefined);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const handleLogOut = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const handleGoogleAuth = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE || ""}/api/auth/google`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#F0EFFA", overflowX: "hidden", fontFamily: "Inter,sans-serif" }}>
      <style>{STYLES}</style>
      <Grain />
      <Navbar scrolled={scrolled} onStartMatching={handleStartMatching} onOpenSearch={() => setSearchOpen(true)} onJoinRoom={() => setJoinOpen(true)} onSeeHowItWorks={handleSeeHowItWorks} onOpenAuth={() => setAuthOpen(true)} user={user} onLogOut={handleLogOut} />
      <Hero onStartMatching={handleStartMatching} onExploreMovies={handleExploreMovies} onSelectMovie={setDetailMovie} />
      <div id="howitworks-section">
        <HowItWorks onStartMatching={handleStartMatching} />
      </div>
      <SwipeDemo />
      <Friends />
      <section style={{ padding: "96px 0", position: "relative", background: "#06060A" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(229,9,20,0.28), transparent)" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", display: "flex", flexWrap: "wrap", gap: 28, alignItems: "stretch" }}>
          <VibePicker onStartMatching={handleStartMatching} selectedGenre={selectedGenre} onGenreSelect={handleSelectGenre} />
          <WhereToWatch />
        </div>
      </section>
      <CTA onStartMatching={handleStartMatching} onSeeHowItWorks={handleSeeHowItWorks} />
      <Footer />

      {showRoomDialog && (
        <RoomCreationDialog onClose={closeRoomDialog} preloadedRoomId={urlRoomId} user={user} genre={selectedGenre || undefined} />
      )}
      {joinOpen && (
        <RoomCreationDialog onClose={() => setJoinOpen(false)} joinMode user={user} />
      )}
      {activeRoom && !showRoomDialog && !joinOpen && (
        <RoomScreen onBack={closeRoomScreen} />
      )}
      <MovieDetailModal movie={detailMovie} onClose={() => setDetailMovie(null)} onStartMatching={handleStartMatching} />
      {searchOpen && <MovieSearchModal onClose={() => setSearchOpen(false)} onSelectMovie={(m) => setDetailMovie(m)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={(u) => { setUser(u); setAuthOpen(false); }} onGoogleAuth={handleGoogleAuth} />}
    </div>
  );
}
