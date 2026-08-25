import { useState, useEffect, useRef } from "react";
import { Heart, X, ChevronRight, Star, Film, Play, Sparkles, Check, Users } from "lucide-react";
import { useRoom } from "@/lib/RoomContext";
import { RoomCreationDialog } from "@/app/components/RoomCreationDialog";
import { RoomScreen } from "@/app/components/RoomScreen";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const HERO_POSTERS = [
  { img: "https://images.unsplash.com/photo-1608889176697-f9b4c77ddb9e?w=300&h=450&fit=crop&auto=format", title: "The Dark Knight", genre: "Action" },
  { img: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=300&h=450&fit=crop&auto=format", title: "Interstellar", genre: "Sci-Fi" },
  { img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop&auto=format", title: "La La Land", genre: "Romance" },
  { img: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&h=450&fit=crop&auto=format", title: "Oppenheimer", genre: "Drama" },
  { img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&h=450&fit=crop&auto=format", title: "Dune", genre: "Sci-Fi" },
];

const POSTER_CONFIGS = [
  { rotation: -16, tx: -96, ty: 18, scale: 0.8, zIndex: 1 },
  { rotation: -8,  tx: -48, ty: -12, scale: 0.88, zIndex: 2 },
  { rotation:  0,  tx:   0, ty:   0, scale: 1,    zIndex: 5 },
  { rotation:  8,  tx:  48, ty: -8,  scale: 0.88, zIndex: 3 },
  { rotation: 15,  tx:  96, ty: 18, scale: 0.8,  zIndex: 2 },
];

const SWIPE_MOVIES = [
  { id: 1, title: "Dune: Part Two",        genre: "Sci-Fi · Adventure", year: 2024, rating: 8.6, matchPct: 92, img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=380&h=540&fit=crop&auto=format", tags: ["Epic", "Visually Stunning", "Sci-Fi"] },
  { id: 2, title: "Oppenheimer",            genre: "Drama · History",    year: 2023, rating: 8.9, matchPct: 87, img: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=380&h=540&fit=crop&auto=format", tags: ["Intense", "Award-Winning"] },
  { id: 3, title: "Past Lives",             genre: "Drama · Romance",    year: 2023, rating: 7.9, matchPct: 78, img: "https://images.unsplash.com/photo-1518708909080-704599b19972?w=380&h=540&fit=crop&auto=format", tags: ["Emotional", "Beautiful"] },
  { id: 4, title: "The Batman",             genre: "Action · Thriller",  year: 2022, rating: 7.8, matchPct: 81, img: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=380&h=540&fit=crop&auto=format", tags: ["Dark", "Gritty"] },
  { id: 5, title: "Everything Everywhere", genre: "Comedy · Sci-Fi",    year: 2022, rating: 8.0, matchPct: 89, img: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=380&h=540&fit=crop&auto=format", tags: ["Weird", "Heartwarming"] },
];

const MOOD_CATEGORIES = ["All", "Trending", "Comedy", "Horror", "Romance", "Action", "Thriller", "Sci-Fi"];

const CAROUSEL_MOVIES = [
  { title: "Oppenheimer",          genre: "Drama",   rating: 8.9, year: 2023, category: "Trending",  img: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=220&h=330&fit=crop&auto=format" },
  { title: "Dune: Part Two",       genre: "Sci-Fi",  rating: 8.6, year: 2024, category: "Sci-Fi",    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=220&h=330&fit=crop&auto=format" },
  { title: "Past Lives",           genre: "Romance", rating: 7.9, year: 2023, category: "Romance",   img: "https://images.unsplash.com/photo-1518708909080-704599b19972?w=220&h=330&fit=crop&auto=format" },
  { title: "The Batman",           genre: "Thriller",rating: 7.8, year: 2022, category: "Thriller",  img: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=220&h=330&fit=crop&auto=format" },
  { title: "Parasite",             genre: "Thriller",rating: 8.6, year: 2019, category: "Thriller",  img: "https://images.unsplash.com/photo-1574267432553-4a801f99b3bc?w=220&h=330&fit=crop&auto=format" },
  { title: "The Grand Budapest",   genre: "Comedy",  rating: 7.9, year: 2014, category: "Comedy",    img: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=220&h=330&fit=crop&auto=format" },
  { title: "Hereditary",           genre: "Horror",  rating: 7.3, year: 2018, category: "Horror",    img: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=220&h=330&fit=crop&auto=format" },
  { title: "Arrival",              genre: "Sci-Fi",  rating: 7.9, year: 2016, category: "Sci-Fi",    img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=220&h=330&fit=crop&auto=format" },
  { title: "Mad Max: Fury Road",   genre: "Action",  rating: 8.1, year: 2015, category: "Action",    img: "https://images.unsplash.com/photo-1608889176697-f9b4c77ddb9e?w=220&h=330&fit=crop&auto=format" },
  { title: "Everything Everywhere",genre: "Comedy",  rating: 8.0, year: 2022, category: "Comedy",    img: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=220&h=330&fit=crop&auto=format" },
  { title: "Get Out",              genre: "Horror",  rating: 7.7, year: 2017, category: "Horror",    img: "https://images.unsplash.com/photo-1574267432553-4a801f99b3bc?w=220&h=330&fit=crop&auto=format" },
  { title: "La La Land",           genre: "Romance", rating: 8.0, year: 2016, category: "Romance",   img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=220&h=330&fit=crop&auto=format" },
];

const FRIENDS = [
  { name: "Alex",   color: "#8B5CF6", angle: -75 },
  { name: "Jordan", color: "#EC4899", angle: -15 },
  { name: "Sam",    color: "#3B82F6", angle:  45 },
  { name: "Riley",  color: "#F97316", angle: 105 },
  { name: "Casey",  color: "#EF4444", angle: 165 },
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
    0%   { box-shadow: 0 0 0 0   rgba(124,58,237,0.6); }
    100% { box-shadow: 0 0 0 20px rgba(124,58,237,0);   }
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
    background: linear-gradient(135deg, #ffe2e2 0%, #f43f5e 38%, #7f0d1a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .grad-bv {
    background: linear-gradient(135deg, #fecdd3 0%, #e11d48 100%);
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

function Navbar({ scrolled, onStartMatching }: { scrolled: boolean; onStartMatching: () => void }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      transition: "background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
      background: scrolled ? "rgba(8,8,9,0.9)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(239,68,68,0.12)" : "1px solid transparent",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#e11d48,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(244,63,94,0.45)" }}>
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
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,250,0.5)")}>{l}</a>
          ))}
          <a href="#" style={{ fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 500, color: "rgba(240,239,250,0.5)", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F0EFFA")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,250,0.5)")}>Log In</a>
        </div>

        {/* CTA */}
        <button
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#b91c1c,#ef4444)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 0 16px rgba(239,68,68,0.18), 0 8px 24px rgba(0,0,0,0.2)", transition: "transform 0.25s, box-shadow 0.25s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(239,68,68,0.25), 0 10px 26px rgba(0,0,0,0.22)"; }}
           onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(239,68,68,0.18), 0 8px 24px rgba(0,0,0,0.2)"; }}
          onClick={onStartMatching}
        >
          Start Matching <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function PosterStack({ mx, my }: { mx: number; my: number }) {
  const NOTIFS = [
    { text: "❤️ You liked this",    top: "6%",  right: "-8%",  left: undefined, bottom: undefined, anim: "float-a 3s ease-in-out infinite",       bg: "rgba(236,72,153,0.14)",  border: "rgba(236,72,153,0.35)" },
    { text: "👥 4 friends matching", top: "38%", right: undefined, left: "-18%", bottom: undefined, anim: "float-b 3.5s ease-in-out infinite 0.4s", bg: "rgba(139,92,246,0.14)", border: "rgba(139,92,246,0.35)" },
    { text: "✨ 92% match",          top: undefined, right: "-12%", left: undefined, bottom: "12%", anim: "float-c 2.8s ease-in-out infinite 0.8s", bg: "rgba(239,68,68,0.14)",  border: "rgba(239,68,68,0.35)" },
  ];

  return (
    <div style={{ position: "relative", width: 340, height: 460 }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.4) 0%, transparent 70%)", filter: "blur(48px)", zIndex: 0 }} />

      {/* Poster group with parallax */}
      <div style={{ position: "relative", width: "100%", height: "100%", transform: `perspective(1100px) rotateY(${mx * -4}deg) rotateX(${my * 2.5}deg)`, transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
        {HERO_POSTERS.map((p, i) => {
          const c = POSTER_CONFIGS[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 190, height: 285,
                left: "50%", top: "50%",
                marginLeft: -95, marginTop: -142,
                borderRadius: 18,
                overflow: "hidden",
                transform: `translateX(${c.tx}px) translateY(${c.ty}px) rotate(${c.rotation}deg) scale(${c.scale})`,
                zIndex: c.zIndex,
                boxShadow: `0 20px 48px rgba(0,0,0,0.65), 0 0 32px rgba(139,92,246,${0.15 + (c.zIndex === 5 ? 0.25 : 0)})`,
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease",
                cursor: "pointer",
                background: "#1a0a2e",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = `translateX(${c.tx}px) translateY(${c.ty - 16}px) rotate(${c.rotation * 0.4}deg) scale(${c.scale + 0.06})`; e.currentTarget.style.zIndex = "20"; e.currentTarget.style.boxShadow = "0 36px 72px rgba(0,0,0,0.7), 0 0 64px rgba(139,92,246,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = `translateX(${c.tx}px) translateY(${c.ty}px) rotate(${c.rotation}deg) scale(${c.scale})`; e.currentTarget.style.zIndex = String(c.zIndex); e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.65), 0 0 32px rgba(139,92,246,${0.15 + (c.zIndex === 5 ? 0.25 : 0)})`; }}
            >
              <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
                <p style={{ color: "white", fontSize: 11, fontWeight: 700, fontFamily: "Manrope,sans-serif", margin: 0 }}>{p.title}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontFamily: "Inter,sans-serif", margin: 0 }}>{p.genre}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating notifications */}
      {NOTIFS.map((n, i) => (
        <div key={i} style={{ position: "absolute", top: n.top, right: n.right, left: n.left, bottom: n.bottom, padding: "8px 14px", borderRadius: 12, background: n.bg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${n.border}`, color: "#F0EFFA", fontSize: 12, fontWeight: 600, fontFamily: "Inter,sans-serif", whiteSpace: "nowrap", zIndex: 30, animation: n.anim }}>
          {n.text}
        </div>
      ))}
    </div>
  );
}

function Hero({ mx, my, onStartMatching, onExploreMovies }: { mx: number; my: number; onStartMatching: () => void; onExploreMovies: () => void }) {
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: `radial-gradient(ellipse 90% 80% at 68% 50%, rgba(244,63,94,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 12% 85%, rgba(136,19,55,0.05) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 88% 8%, rgba(244,63,94,0.03) 0%, transparent 45%), #050505` }}>
      {/* Background lights */}
      <div style={{ position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "3%", bottom: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(159,18,57,0.04) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px 48px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 64, alignItems: "center" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 50, background: "rgba(159,18,57,0.12)", border: "1px solid rgba(244,63,94,0.26)", color: "#fecdd3", fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", width: "fit-content" }}>
              <Sparkles size={13} /> 2M+ Movie Nights Planned
            </div>

            <h1 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 1.04, letterSpacing: "-0.03em", margin: 0 }}>
              Find the movie{" "}
              <span className="grad-vp" style={{ display: "block" }}>everyone wants</span>
              to watch.
            </h1>

            <p className="reveal d2" style={{ fontFamily: "Inter,sans-serif", fontSize: "clamp(16px, 1.5vw, 19px)", color: "rgba(240,239,250,0.52)", lineHeight: 1.65, margin: 0, maxWidth: 460 }}>
              Stop scrolling. Start matching. Discover movies that you and your friends actually agree on.
            </p>

            <div className="reveal d3" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 28px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#e11d48,#f43f5e)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 36px rgba(244,63,94,0.45), 0 10px 40px rgba(0,0,0,0.4)", transition: "transform 0.25s, box-shadow 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 52px rgba(244,63,94,0.7), 0 16px 48px rgba(0,0,0,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(244,63,94,0.45), 0 10px 40px rgba(0,0,0,0.4)"; }}
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

            {/* Social proof */}
            <div className="reveal d4" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {["A","J","S","R","M"].map((l, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #06060A", background: `hsl(${i * 52 + 240},58%,44%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, marginLeft: i ? -10 : 0, zIndex: i, fontFamily: "Inter,sans-serif" }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(240,239,250,0.38)", margin: "2px 0 0" }}>Join 500K+ movie lovers</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="reveal d2" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <PosterStack mx={mx} my={my} />
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
    { emoji: "🏠", num: "01", title: "Create a Room",    desc: "Start a session and share a link. Your crew joins in seconds — no app download needed.",    color: "#f43f5e", cta: "Invite friends →" },
    { emoji: "👆", num: "02", title: "Everyone Swipes",  desc: "Each person swipes through curated picks. Like what excites you. Skip the rest. Fast.",       color: "#ef4444", cta: "Swipe to match →" },
    { emoji: "🎉", num: "03", title: "Find the Match",   desc: "CineMatch reveals the overlap — the one film the whole group actually wants to watch.",        color: "#e11d48", cta: "4/4 MATCH!" },
  ];

  return (
    <section style={{ position: "relative", padding: "128px 0", background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,63,94,0.06) 0%, transparent 60%), #06060A` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(244,63,94,0.32), transparent)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(244,63,94,0.7)", marginBottom: 16 }}>How It Works</p>
          <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(32px,4vw,52px)", letterSpacing: "-0.025em", margin: 0 }}>
            Three steps to <span className="grad-vp">movie night bliss</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} className={`reveal d${i + 1}`} style={{ position: "relative", padding: "34px 28px 30px", borderRadius: 22, background: "linear-gradient(180deg, rgba(20,20,20,0.96), rgba(10,10,10,0.96))", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 18px 48px rgba(0,0,0,0.32)", transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease", cursor: "default" }}
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
                <button onClick={onStartMatching} style={{ display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 999, background: "rgba(239,68,68,0.09)", border: `1px solid ${s.color}55`, color: s.color, fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif", letterSpacing: "0.02em", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.09)"}>{s.cta}</button>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}22`, color: s.color, fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif", letterSpacing: "0.02em" }}>{s.cta}</span>
              )}
            </div>
          ))}
        </div>

        {/* Match moment */}
        <div className="reveal d4" style={{ marginTop: 64, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "20px 32px", borderRadius: 20, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 48px rgba(239,68,68,0.08)" }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, color: "#EF4444", margin: "0 0 2px" }}>IT'S A MATCH!</p>
              <p style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 18, margin: 0 }}>4/4 Friends agree on <span style={{ color: "#EF4444" }}>Dune: Part Two</span></p>
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

function MatchCelebration({ movie, onReset }: { movie: typeof SWIPE_MOVIES[0]; onReset: () => void }) {
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

      <div style={{ display: "inline-block", padding: "8px 24px", borderRadius: 50, background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "white", fontSize: 13, fontWeight: 800, fontFamily: "Inter,sans-serif", letterSpacing: "0.05em", marginBottom: 32, boxShadow: "0 0 40px rgba(124,58,237,0.6)" }}>
        🎉 IT'S A MATCH!
      </div>

      <div style={{ position: "relative", width: 220, height: 310, margin: "0 auto 28px", borderRadius: 24, overflow: "hidden", boxShadow: "0 0 80px rgba(124,58,237,0.5), 0 32px 64px rgba(0,0,0,0.6)", animation: "pulse-ring 1.5s ease-out" }}>
        <img src={movie.img} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", background: "#1a0a2e" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
          <p style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 16, color: "white", margin: 0 }}>{movie.title}</p>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, border: "2px solid rgba(124,58,237,0.7)", boxShadow: "inset 0 0 32px rgba(124,58,237,0.2)" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        {["A","J","S","R"].map((l, i) => (
          <div key={i} style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", border: "2px solid #EF4444", background: `hsl(${i*52+240},58%,44%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, marginLeft: i ? -10 : 0, zIndex: i, fontFamily: "Inter,sans-serif" }}>
            {l}
            <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={8} color="white" strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "Manrope,sans-serif", fontSize: 18, fontWeight: 800, color: "#EF4444", margin: "0 0 6px" }}>4/4 friends matched!</p>
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
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [matched, setMatched] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const swipe = (d: "left" | "right") => {
    if (dir || matched) return;
    setDir(d);
    setHintVisible(false);
    setTimeout(() => {
      const next = idx + 1;
      if (next >= SWIPE_MOVIES.length) {
        setMatched(true);
      } else {
        setIdx(next);
      }
      setDir(null);
    }, 480);
  };

  const reset = () => { setIdx(0); setDir(null); setMatched(false); setHintVisible(true); };

  const movie = SWIPE_MOVIES[Math.min(idx, SWIPE_MOVIES.length - 1)];

  return (
    <section style={{ padding: "128px 0", background: "#06060A", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(236,72,153,0.4), transparent)" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(236,72,153,0.7)", marginBottom: 16 }}>Try It</p>
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
                {SWIPE_MOVIES.map((_, i) => (
                  <div key={i} style={{ height: 4, borderRadius: 2, transition: "all 0.4s ease", width: i === idx ? 24 : 8, background: i < idx ? "#8B5CF6" : i === idx ? "#EC4899" : "rgba(255,255,255,0.14)" }} />
                ))}
              </div>

              {/* Card stack */}
              <div style={{ position: "relative", width: 320, height: 460 }}>
                {/* Shadow card behind */}
                {idx < SWIPE_MOVIES.length - 1 && (
                  <div style={{ position: "absolute", inset: 0, top: 14, left: 12, right: 12, borderRadius: 28, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", transform: "scale(0.95) translateY(8px)", zIndex: 0 }} />
                )}

                {/* Main card */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 28, overflow: "hidden", zIndex: 5, background: "#1a0a2e",
                  transform: dir === "right" ? "translateX(160%) rotate(22deg)" : dir === "left" ? "translateX(-160%) rotate(-22deg)" : "translateX(0) rotate(0)",
                  transition: dir ? "transform 0.48s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
                  animation: dir ? "none" : "swipe-card-enter 0.48s cubic-bezier(0.22,1,0.36,1) both",
                  boxShadow: "0 32px 72px rgba(0,0,0,0.65), 0 0 48px rgba(139,92,246,0.2)",
                }}>
                  <img src={movie.img} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)" }} />

                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 28px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {movie.tags.map(t => (
                        <span key={t} style={{ padding: "3px 10px", borderRadius: 50, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>{t}</span>
                      ))}
                    </div>
                    <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 24, color: "white", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{movie.title}</h3>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.48)", margin: "0 0 14px" }}>{movie.genre} · {movie.year}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700 }}>{movie.rating}</span>
                      </div>
                      <div style={{ padding: "3px 10px", borderRadius: 50, background: "rgba(239,68,68,0.15)", color: "#EF4444", fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{movie.matchPct}% match</div>
                    </div>
                  </div>

                  {/* Swipe indicators */}
                  {dir === "right" && (
                    <div style={{ position: "absolute", top: 24, left: 20, padding: "8px 16px", borderRadius: 12, background: "rgba(236,72,153,0.2)", border: "2px solid #EC4899", color: "#EC4899", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 18, transform: "rotate(-8deg)" }}>LIKE ❤️</div>
                  )}
                  {dir === "left" && (
                    <div style={{ position: "absolute", top: 24, right: 20, padding: "8px 16px", borderRadius: 12, background: "rgba(239,68,68,0.2)", border: "2px solid #EF4444", color: "#EF4444", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 18, transform: "rotate(8deg)" }}>SKIP ✕</div>
                  )}
                </div>
              </div>

              {/* Hint */}
              {hintVisible && (
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(240,239,250,0.28)", margin: 0 }}>← Skip · Like →</p>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <button onClick={() => swipe("left")} disabled={!!dir} style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.09)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s, transform 0.2s", boxShadow: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; e.currentTarget.style.transform = "scale(1.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.09)"; e.currentTarget.style.transform = "scale(1)"; }}>
                  <X size={24} />
                </button>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(255,255,255,0.28)", width: 60, textAlign: "center", margin: 0 }}>{idx + 1} / {SWIPE_MOVIES.length}</p>
                <button onClick={() => swipe("right")} disabled={!!dir} style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid rgba(236,72,153,0.35)", background: "rgba(236,72,153,0.1)", color: "#EC4899", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s, transform 0.2s, box-shadow 0.2s", boxShadow: "0 0 20px rgba(236,72,153,0.2)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,72,153,0.2)"; e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(236,72,153,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(236,72,153,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(236,72,153,0.2)"; }}>
                  <Heart size={24} />
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
    <section style={{ padding: "128px 0", position: "relative", background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.05) 0%, transparent 70%), #06060A` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(139,92,246,0.45), transparent)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 80, alignItems: "center" }}>

          {/* Text */}
          <div>
            <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(139,92,246,0.7)", marginBottom: 20 }}>Social Matching</p>
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

            <div className="reveal d4" style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 24px", borderRadius: 18, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div style={{ display: "flex" }}>
                {["A","J","S","R"].map((l, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(239,68,68,0.5)", background: `hsl(${i*52+240},58%,44%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginLeft: i ? -7 : 0, zIndex: i, fontFamily: "Inter,sans-serif" }}>{l}</div>
                ))}
              </div>
              <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 20, color: "#EF4444" }}>4/4 MATCH</span>
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
              <div style={{ position: "absolute", left: cx - 52, top: cy - 72, width: 104, height: 144, borderRadius: 16, overflow: "hidden", zIndex: 10, boxShadow: "0 0 48px rgba(124,58,237,0.55), 0 16px 40px rgba(0,0,0,0.55)", border: "2px solid rgba(124,58,237,0.55)", animation: visible ? "pulse-ring 2s ease-out infinite" : "none" }}>
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
// MOVIE CAROUSEL
// ─────────────────────────────────────────────

function CarouselCard({ movie }: { movie: typeof CAROUSEL_MOVIES[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ position: "relative", flexShrink: 0, width: 175, height: 255, borderRadius: 18, overflow: "hidden", cursor: "pointer", background: "#1a0a2e", transform: hov ? "translateY(-14px) scale(1.05)" : "translateY(0) scale(1)", transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease", boxShadow: hov ? "0 36px 64px rgba(0,0,0,0.72), 0 0 48px rgba(124,58,237,0.38)" : "0 8px 32px rgba(0,0,0,0.4)" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <img src={movie.img} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hov ? "scale(1.1)" : "scale(1)" }} />
      <div style={{ position: "absolute", inset: 0, background: hov ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 45%, transparent 75%)" : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)", transition: "background 0.3s" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
        <p style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 13, color: "white", margin: "0 0 2px", lineHeight: 1.2 }}>{movie.title}</p>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 10, color: "rgba(255,255,255,0.42)", margin: "0 0 6px" }}>{movie.genre} · {movie.year}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(4px)", transition: "opacity 0.25s, transform 0.25s" }}>
          <Star size={11} fill="#F59E0B" color="#F59E0B" />
          <span style={{ fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700 }}>{movie.rating}</span>
        </div>
      </div>
      {hov && (
        <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px", borderRadius: 50, background: "rgba(124,58,237,0.45)", border: "1px solid rgba(124,58,237,0.6)", color: "#C4B5FD", fontSize: 9, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{movie.category}</div>
      )}
    </div>
  );
}

function Carousel() {
  const [cat, setCat] = useState("All");
  const filtered = cat === "All" ? CAROUSEL_MOVIES : CAROUSEL_MOVIES.filter(m => m.category === cat);

  return (
    <section style={{ padding: "128px 0", background: "#06060A", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(249,115,22,0.4), transparent)" }} />

      {/* Header */}
      <div style={{ maxWidth: 1280, margin: "0 auto 40px", padding: "0 24px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
        <div>
          <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(249,115,22,0.7)", marginBottom: 12 }}>Discovery</p>
          <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(30px,3.5vw,48px)", letterSpacing: "-0.025em", margin: 0 }}>
            Something for <span className="grad-vp">every mood.</span>
          </h2>
        </div>
        <div className="reveal d2" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MOOD_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "8px 16px", borderRadius: 50, border: `1px solid ${cat === c ? "transparent" : "rgba(255,255,255,0.08)"}`, background: cat === c ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "rgba(255,255,255,0.04)", color: cat === c ? "white" : "rgba(240,239,250,0.5)", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s", boxShadow: cat === c ? "0 0 20px rgba(124,58,237,0.35)" : "none" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none", WebkitOverflowScrolling: "touch", paddingLeft: `max(24px, calc((100vw - 1280px) / 2 + 24px))`, paddingRight: 24 }}>
        {(filtered.length ? filtered : CAROUSEL_MOVIES).map((m, i) => <CarouselCard key={`${m.title}-${i}`} movie={m} />)}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// WHERE TO WATCH
// ─────────────────────────────────────────────

function WhereToWatch() {
  const [sel, setSel] = useState(0);

  return (
    <section style={{ padding: "128px 0", position: "relative", background: `radial-gradient(ellipse 70% 60% at 28% 50%, rgba(59,130,246,0.05) 0%, transparent 60%), #06060A` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(59,130,246,0.4), transparent)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 80, alignItems: "center" }}>

          {/* Text */}
          <div>
            <p className="reveal" style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(59,130,246,0.7)", marginBottom: 20 }}>Streaming</p>
            <h2 className="reveal d1" style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: "clamp(30px,3.5vw,48px)", letterSpacing: "-0.025em", margin: "0 0 20px" }}>
              Know exactly{" "}
              <span className="grad-bv">where to watch.</span>
            </h2>
            <p className="reveal d2" style={{ fontFamily: "Inter,sans-serif", fontSize: 16, color: "rgba(240,239,250,0.5)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 420 }}>
              CineMatch shows every platform where your matched movie is available — so you can hit play in seconds, not minutes.
            </p>

            <div className="reveal d3" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {STREAMING.map((s, i) => (
                <button key={s.name} onClick={() => setSel(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 14, border: `1px solid ${sel === i ? s.color + "55" : "rgba(255,255,255,0.08)"}`, background: sel === i ? `${s.color}18` : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.3s", boxShadow: sel === i ? `0 0 24px ${s.color}28` : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 9, fontWeight: 900, fontFamily: "Manrope,sans-serif" }}>{s.letter}</div>
                  <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: sel === i ? s.color : "rgba(240,239,250,0.55)", transition: "color 0.3s" }}>{s.name}</span>
                  {sel === i && <Check size={13} color={s.color} />}
                </button>
              ))}
            </div>
          </div>

          {/* Movie mockup */}
          <div className="reveal d2" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 260, height: 380, borderRadius: 26, overflow: "hidden", boxShadow: "0 0 80px rgba(59,130,246,0.18), 0 32px 64px rgba(0,0,0,0.6)", background: "#1a0a2e" }}>
              <img src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=260&h=380&fit=crop&auto=format" alt="Dune: Part Two" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={13} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700 }}>8.6</span>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 50, background: "rgba(124,58,237,0.3)", color: "#A78BFA", fontSize: 10, fontFamily: "Inter,sans-serif", fontWeight: 700 }}>Sci-Fi</span>
                </div>
                <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 20, color: "white", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Dune: Part Two</h3>
                <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 14px" }}>2024 · 2h 46m</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: `${STREAMING[sel].color}1A`, border: `1px solid ${STREAMING[sel].color}44`, transition: "all 0.3s" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: STREAMING[sel].color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 8, fontWeight: 900, fontFamily: "Manrope,sans-serif", flexShrink: 0 }}>{STREAMING[sel].letter}</div>
                  <span style={{ fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 700, color: STREAMING[sel].color, transition: "color 0.3s" }}>Watch on {STREAMING[sel].name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(124,58,237,0.28) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 840, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <div className="reveal" style={{ display: "inline-block", padding: "8px 20px", borderRadius: 50, background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.32)", color: "#A78BFA", fontSize: 13, fontWeight: 700, fontFamily: "Inter,sans-serif", marginBottom: 32 }}>
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
          <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 36px", borderRadius: 50, border: "none", background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "white", fontFamily: "Inter,sans-serif", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 56px rgba(124,58,237,0.65), 0 0 112px rgba(124,58,237,0.25), 0 20px 48px rgba(0,0,0,0.5)", transition: "transform 0.25s, box-shadow 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 72px rgba(124,58,237,0.8), 0 0 144px rgba(124,58,237,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 0 56px rgba(124,58,237,0.65), 0 0 112px rgba(124,58,237,0.25), 0 20px 48px rgba(0,0,0,0.5)"; }}
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
          {["No credit card required", "Free for groups up to 8", "2M+ movies in catalog"].map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(240,239,250,0.32)" }}>
              <span style={{ color: "#EF4444", fontWeight: 700 }}>✓</span> {t}
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
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
  const [scrolled, setScrolled] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [urlRoomId, setUrlRoomId] = useState<string | undefined>(undefined);
  const { room: activeRoom, leaveRoom } = useRoom();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId) {
      setUrlRoomId(roomId);
      setShowRoomDialog(true);
    }
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

  const handleExploreMovies = () => {
    document.getElementById("carousel-section")?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#F0EFFA", overflowX: "hidden", fontFamily: "Inter,sans-serif" }}>
      <style>{STYLES}</style>
      <Grain />
      <Navbar scrolled={scrolled} onStartMatching={handleStartMatching} />
      <Hero mx={mouse.x} my={mouse.y} onStartMatching={handleStartMatching} onExploreMovies={handleExploreMovies} />
      <div id="howitworks-section">
        <HowItWorks onStartMatching={handleStartMatching} />
      </div>
      <SwipeDemo />
      <Friends />
      <div id="carousel-section">
        <Carousel />
      </div>
      <WhereToWatch />
      <CTA onStartMatching={handleStartMatching} onSeeHowItWorks={handleSeeHowItWorks} />
      <Footer />

      {showRoomDialog && (
        <RoomCreationDialog onClose={closeRoomDialog} preloadedRoomId={urlRoomId} />
      )}
      {activeRoom && !showRoomDialog && (
        <RoomScreen onBack={closeRoomScreen} />
      )}
    </div>
  );
}
