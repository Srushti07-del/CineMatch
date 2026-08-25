import { useState, useRef, useEffect } from "react";
import { X, ChevronRight, Copy, Check, Link } from "lucide-react";
import { useRoom } from "@/lib/RoomContext";

export function RoomCreationDialog({ onClose, preloadedRoomId }: { onClose: () => void; preloadedRoomId?: string }) {
  const { createRoom, joinRoom, isCreating, error, room, dismissError } = useRoom();
  const [step, setStep] = useState<"form" | "room">(preloadedRoomId ? "join" : "form");
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [genre, setGenre] = useState("Trending");
  const [copied, setCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const GENRES = ["Trending", "Action", "Sci-Fi", "Comedy", "Horror", "Romance", "Drama", "Animation"];

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (room) {
      setStep("room");
    }
  }, [room]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createRoom(name.trim(), roomName.trim() || undefined, genre);
  };

  const handleJoin = async () => {
    if (!name.trim() || !preloadedRoomId) return;
    await joinRoom(preloadedRoomId, name.trim());
  };

  const handleCopyLink = () => {
    if (room) {
      const url = `${window.location.origin}?room=${room.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartSwiping = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("room-modal-backdrop")) {
      onClose();
    }
  };

  return (
    <div
      className="room-modal-backdrop"
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={handleBackdropClick}
    >
      <div style={{
        background: "linear-gradient(180deg, #0a0a0e, #06060A)",
        borderRadius: 24, border: "1px solid rgba(244,63,94,0.32)",
        boxShadow: "0 0 56px rgba(244,63,94,0.45), 0 32px 64px rgba(0,0,0,0.6)",
        padding: 36, maxWidth: 440, width: "92%",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(240,239,250,0.4)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        {step === "form" && (
          <>
            <h2 style={{
              fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 24,
              color: "white", margin: "0 0 4px", letterSpacing: "-0.02em"
            }}>
              Start a Movie Night
            </h2>
            <p style={{
              fontFamily: "Inter,sans-serif", fontSize: 14,
              color: "rgba(240,239,250,0.45)", margin: "0 0 20px"
            }}>
              Choose a vibe, name your room, and invite your crew to swipe in real-time.
            </p>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                color: "#FCA5A5", fontSize: 13, fontFamily: "Inter,sans-serif",
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{
                  fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                  color: "rgba(240,239,250,0.42)", marginBottom: 6, display: "block"
                }}>Your Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, outline: "none",
                  }}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                  color: "rgba(240,239,250,0.42)", marginBottom: 6, display: "block"
                }}>Movie Genre / Mood</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {GENRES.map((g) => {
                    const isSelected = genre === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenre(g)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          fontFamily: "Inter,sans-serif",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          border: isSelected
                            ? "1px solid #f43f5e"
                            : "1px solid rgba(255,255,255,0.08)",
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(225,29,72,0.35), rgba(244,63,94,0.25))"
                            : "rgba(255,255,255,0.03)",
                          color: isSelected ? "#fff" : "rgba(240,239,250,0.6)",
                          boxShadow: isSelected ? "0 0 16px rgba(244,63,94,0.3)" : "none",
                        }}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{
                  fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                  color: "rgba(240,239,250,0.42)", marginBottom: 6, display: "block"
                }}>Room Name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Friday Movie Night"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, outline: "none",
                  }}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 50, border: "none",
                background: !name.trim()
                  ? "rgba(244,63,94,0.35)"
                  : "linear-gradient(135deg,#e11d48,#f43f5e)",
                color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700,
                cursor: !name.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: !name.trim() ? "none" : "0 0 32px rgba(244,63,94,0.45), 0 8px 24px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={e => {
                if (!name.trim() || isCreating) return;
                e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 0 48px rgba(244,63,94,0.6), 0 12px 36px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={e => {
                if (!name.trim() || isCreating) return;
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 0 32px rgba(244,63,94,0.45), 0 8px 24px rgba(0,0,0,0.3)";
              }}
            >
              {isCreating ? "Creating..." : "Create Room"} <ChevronRight size={16} />
            </button>
          </>
        )}

        {step === "join" && (
          <>
            <h2 style={{
              fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 24,
              color: "white", margin: "0 0 4px", letterSpacing: "-0.02em"
            }}>
              Join a Movie Night
            </h2>
            <p style={{
              fontFamily: "Inter,sans-serif", fontSize: 14,
              color: "rgba(240,239,250,0.45)", margin: "0 0 24px"
            }}>
              Enter your name to join room <span style={{ color: "#F59E0B" }}>{preloadedRoomId}</span>.
            </p>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                color: "#FCA5A5", fontSize: 13, fontFamily: "Inter,sans-serif",
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{
                  fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                  color: "rgba(240,239,250,0.42)", marginBottom: 6, display: "block"
                }}>Your Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, outline: "none",
                  }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                />
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={isCreating || !name.trim()}
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 50, border: "none",
                background: !name.trim()
                  ? "rgba(244,63,94,0.35)"
                  : "linear-gradient(135deg,#7C3AED,#EC4899)",
                color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700,
                cursor: !name.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: !name.trim() ? "none" : "0 0 32px rgba(124,58,237,0.45), 0 8px 24px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={e => {
                if (!name.trim() || isCreating) return;
                e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 0 48px rgba(124,58,237,0.6), 0 12px 36px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={e => {
                if (!name.trim() || isCreating) return;
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 0 32px rgba(124,58,237,0.45), 0 8px 24px rgba(0,0,0,0.3)";
              }}
            >
              {isCreating ? "Joining..." : "Join Room"} <ChevronRight size={16} />
            </button>
          </>
        )}

        {step === "room" && room && (
          <>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg,#e11d48,#f43f5e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: 28,
              }}>
                🎬
              </div>
              <h2 style={{
                fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 20,
                color: "white", margin: "0 0 4px"
              }}>
                {room.name}
              </h2>
              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: 13,
                color: "rgba(240,239,250,0.45)", margin: 0
              }}>
                {room.participants.length} participant{room.participants.length !== 1 ? "s" : ""} in the room
              </p>
            </div>

            <div style={{
              padding: "16px 16px 12px", borderRadius: 14,
              background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.25)",
              marginBottom: 20,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8
              }}>
                <Link size={13} color="#A78BFA" />
                <span style={{
                  fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 700,
                  color: "rgba(240,239,250,0.32)", textTransform: "uppercase", letterSpacing: "0.04em"
                }}>Invite Link</span>
              </div>
              <div style={{
                display: "flex", gap: 8, fontFamily: "Inter,sans-serif", fontSize: 12,
                color: "rgba(240,239,250,0.45)", wordBreak: "break-all"
              }}>
                {`${window.location.origin}?room=${room.id}`}
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              style={{
                width: "100%", padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)", color: "rgba(240,239,250,0.78)",
                fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s", marginBottom: 16
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              {copied ? (
                <>
                  <Check size={14} color="#10B981" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Invite Link
                </>
              )}
            </button>

            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              {room.participants.map((p) => (
                <div key={p.id} style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)", textAlign: "center"
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `hsl(${p.id.charCodeAt(0) * 7 + 120}, 58%, 44%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, fontFamily: "Inter,sans-serif", margin: "0 auto 6px"
                  }}>
                    {p.name[0] || "U"}
                  </div>
                  <span style={{
                    fontFamily: "Inter,sans-serif", fontSize: 12,
                    color: p.id === room.hostId ? "#F59E0B" : "rgba(240,239,250,0.55)"
                  }}>
                    {p.name}{p.id === room.hostId && " (host)"}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartSwiping}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 50, border: "none",
                background: "linear-gradient(135deg,#7C3AED,#EC4899)",
                color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                boxShadow: "0 0 32px rgba(124,58,237,0.45), 0 8px 24px rgba(0,0,0,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 0 48px rgba(124,58,237,0.6), 0 12px 36px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 0 32px rgba(124,58,237,0.45), 0 8px 24px rgba(0,0,0,0.3)";
              }}
            >
              Start Swiping <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
