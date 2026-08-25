import { useEffect, useState } from "react";
import { Heart, X, Copy, Check, ChevronLeft, Wifi, WifiOff, Users } from "lucide-react";
import { useRoom } from "@/lib/RoomContext";
import type { Movie } from "../../shared/types";

function SwipeCard({
  movie,
  direction,
}: {
  movie: Movie;
  direction: "left" | "right" | null;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      position: "relative", width: 320, height: 460, borderRadius: 28, overflow: "hidden",
      cursor: "grab", background: "#1a0a2e",
      transform: direction === "right" ? "translateX(160%) rotate(22deg)" : direction === "left" ? "translateX(-160%) rotate(-22deg)" : "translateX(0) rotate(0)",
      transition: direction ? "transform 0.48s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
      animation: direction ? "none" : "swipe-card-enter 0.48s cubic-bezier(0.22,1,0.36,1) both",
      boxShadow: "0 32px 72px rgba(0,0,0,0.65), 0 0 24px rgba(244,63,94,0.15)",
    }}>
      <img src={movie.img} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }} />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 28px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {movie.tags?.map(t => (
            <span key={t} style={{ padding: "3px 10px", borderRadius: 50, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>{t}</span>
          ))}
        </div>
        <h3 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 24, color: "white", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{movie.title}</h3>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(255,255,255,0.48)", margin: "0 0 14px" }}>{movie.genre} · {movie.year}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L20 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 4 9.27l4.91-1.01L12 2z" fill="#F59E0B" />
            </svg>
            <span style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700 }}>{movie.rating}</span>
          </div>
          <div style={{ padding: "3px 10px", borderRadius: 50, background: "rgba(239,68,68,0.15)", color: "#EF4444", fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{movie.matchPct}% match</div>
        </div>
      </div>

      {direction === "right" && (
        <div style={{ position: "absolute", top: 24, left: 20, padding: "8px 16px", borderRadius: 12, background: "rgba(236,72,153,0.2)", border: "2px solid #EC4899", color: "#EC4899", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 18, transform: "rotate(-8deg)" }}>LIKE ❤️</div>
      )}
      {direction === "left" && (
        <div style={{ position: "absolute", top: 24, right: 20, padding: "8px 16px", borderRadius: 12, background: "rgba(239,68,68,0.2)", border: "2px solid #EF4444", color: "#EF4444", fontFamily: "Manrope,sans-serif", fontWeight: 900, fontSize: 18, transform: "rotate(8deg)" }}>SKIP ✕</div>
      )}
    </div>
  );
}

export function RoomScreen({ onBack }: { onBack: () => void }) {
  const { room, swipe, isConnected, participantId, participantName, leaveRoom } = useRoom();
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [matched, setMatched] = useState<Movie | null>(null);
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const movie = room.movies?.[room.currentMovieIndex];

  const handleSwipe = (direction: "left" | "right") => {
    if (dir || !movie || !isConnected) return;
    setDir(direction);
    swipe(movie.id, direction);
    setTimeout(() => {
      setDir(null);
    }, 480);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "radial-gradient(ellipse 90% 80% at 68% 50%, rgba(244,63,94,0.12) 0%, transparent 70%), #050505",
      overflowY: "auto",
    }}>
      <style>{`
        @keyframes swipe-card-enter {
          0% { opacity: 0; transform: translateY(18px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 50,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(240,239,250,0.6)", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            <ChevronLeft size={16} /> Back to Landing
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Inter,sans-serif", fontSize: 12, color: isConnected ? "#10B981" : "#EF4444" }}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />} {isConnected ? "Connected" : "Connecting..."}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {room.participants.map((p, i) => (
                <div key={p.id} style={{
                  width: 32, height: 32, borderRadius: "50%", border: "2px solid #06060A",
                  background: `hsl(${i * 52 + 240},58%,44%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, marginLeft: i ? -8 : 0, zIndex: i,
                  fontFamily: "Inter,sans-serif", position: "relative"
                }}>
                  {p.name[0] || "U"}
                  {p.id === room.hostId && (
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", border: "1px solid #06060A" }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.06)" }} />

            <button
              onClick={handleCopyLink}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(240,239,250,0.6)", fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              <Users size={14} /> Invite
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?room=${room.id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,239,250,0.6)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {copied ? <Check size={15} color="#10B981" /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        {/* Room title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{
            fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 24,
            color: "white", margin: 0, letterSpacing: "-0.02em"
          }}>{room.name}</h2>
          <p style={{
            fontFamily: "Inter,sans-serif", fontSize: 13,
            color: "rgba(240,239,250,0.42)", margin: "4px 0 0"
          }}>
            {room.participants.length} friend{room.participants.length !== 1 ? "s" : ""} joined
          </p>
        </div>

        {/* Swipe area */}
        {matched ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 28px",
              borderRadius: 50, background: "linear-gradient(135deg,#7C3AED,#EC4899)",
              color: "white", fontSize: 14, fontWeight: 800, fontFamily: "Inter,sans-serif",
              boxShadow: "0 0 40px rgba(124,58,237,0.6)", marginBottom: 32
            }}>
              🎉 MATCH!
            </div>
            <div style={{ position: "relative", width: 220, height: 310, margin: "0 auto 24px", borderRadius: 24, overflow: "hidden", boxShadow: "0 0 60px rgba(244,63,94,0.3), 0 32px 64px rgba(0,0,0,0.6)" }}>
              <img src={matched.img} alt={matched.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
                <p style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 16, color: "white", margin: 0 }}>{matched.title}</p>
              </div>
            </div>
            <p style={{
              fontFamily: "Manrope,sans-serif", fontSize: 18, fontWeight: 800, color: "#EF4444", margin: "0 0 8px"
            }}>Everyone wants to watch {matched.title}!</p>
            <p style={{
              fontFamily: "Inter,sans-serif", fontSize: 14, color: "rgba(240,239,250,0.32)", margin: 0
            }}>But no one's perfect. Keep swiping to find more matches.</p>
          </div>
        ) : movie ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            {/* Progress */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {room.movies?.slice(0, room.currentMovieIndex + 1).map((_, i) => (
                <div key={i} style={{
                  height: 4, borderRadius: 2, transition: "all 0.4s ease",
                  width: i === room.currentMovieIndex ? 24 : 8,
                  background: i < room.currentMovieIndex ? "#F59E0B" : i === room.currentMovieIndex ? "#EC4899" : "rgba(255,255,255,0.14)"
                }} />
              ))}
            </div>

            {/* Card stack */}
            <div style={{ position: "relative", width: 340, height: 460 }}>
              {room.currentMovieIndex < (room.movies?.length || 0) - 1 && (
                <div style={{ position: "absolute", inset: 0, top: 14, left: 12, right: 12, borderRadius: 28, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", transform: "scale(0.95) translateY(8px)", zIndex: 0 }} />
              )}
              <SwipeCard movie={movie} direction={dir} />
            </div>

            {/* Hint */}
            {!dir && (
              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: 12,
                color: "rgba(240,239,250,0.28)", margin: 0
              }}>← Skip · Like →</p>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button
                onClick={() => handleSwipe("left")}
                disabled={!!dir || !isConnected}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.09)", color: "#EF4444",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: !isConnected ? "not-allowed" : "pointer",
                  opacity: !isConnected ? 0.4 : 1,
                  transition: "background 0.2s, transform 0.2s"
                }}
                onMouseEnter={e => { if (isConnected && !dir) { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; e.currentTarget.style.transform = "scale(1.08)"; } }}
                onMouseLeave={e => { if (isConnected && !dir) { e.currentTarget.style.background = "rgba(239,68,68,0.09)"; e.currentTarget.style.transform = "scale(1)"; } }}
              >
                <X size={24} />
              </button>
              <span style={{
                fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(240,239,250,0.28)",
                width: 60, textAlign: "center"
              }}>{room.currentMovieIndex + 1} / {room.movies?.length || 0}</span>
              <button
                onClick={() => handleSwipe("right")}
                disabled={!!dir || !isConnected}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  border: "1px solid rgba(236,72,153,0.35)",
                  background: "rgba(236,72,153,0.1)", color: "#EC4899",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: !isConnected ? "not-allowed" : "pointer",
                  opacity: !isConnected ? 0.4 : 1,
                  transition: "background 0.2s, transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => { if (isConnected && !dir) { e.currentTarget.style.background = "rgba(236,72,153,0.2)"; e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(236,72,153,0.3)"; } }}
                onMouseLeave={e => { if (isConnected && !dir) { e.currentTarget.style.background = "rgba(236,72,153,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; } }}
              >
                <Heart size={24} />
              </button>
            </div>

            {!isConnected && (
              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: 12,
                color: "rgba(239,68,68,0.5)", margin: 0
              }}>Waiting for connection...</p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "48px" }}>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 16, color: "rgba(240,239,250,0.32)" }}>No more movies to swipe. Room is finished.</p>
          </div>
        )}
      </div>
    </div>
  );
}
