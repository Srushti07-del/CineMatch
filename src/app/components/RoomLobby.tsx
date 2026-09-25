import { useEffect, useState } from "react";
import { ChevronLeft, Wifi, WifiOff, Users, Copy, Check, Crown, UserX, Loader2 } from "lucide-react";
import { useRoom } from "@/lib/RoomContext";
import { ChatPanel } from "./ChatPanel";
import type { Participant } from "../../../shared/types";

function ParticipantAvatar({ name, isHost, isOnline }: { name: string; isHost: boolean; isOnline: boolean }) {
  const hue = (name.charCodeAt(0) * 17 + (name.charCodeAt(1) || 0) * 31) % 360;
  return (
    <div style={{
      position: "relative",
      width: 44, height: 44, borderRadius: "50%",
      background: isOnline ? `hsl(${hue}, 50%, 35%)` : "rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, color: isOnline ? "white" : "rgba(255,255,255,0.2)",
      fontFamily: "Inter,sans-serif", flexShrink: 0,
      transition: "all 0.3s ease",
      border: isHost ? "2px solid rgba(245,158,11,0.5)" : "2px solid transparent",
    }}>
      {name[0] || "?"}
      {isHost && (
        <div style={{
          position: "absolute", bottom: -4, right: -4, width: 14, height: 14,
          borderRadius: "50%", background: "#F59E0B", border: "2px solid #050505",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Crown size={8} color="#050505" />
        </div>
      )}
    </div>
  );
}

export function RoomLobby({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const { room, isConnected, participantId, participantName, leaveRoom, kickParticipant, toggleReady, error, dismissError } = useRoom();
  const [copied, setCopied] = useState(false);
  const [kicking, setKicking] = useState<string | null>(null);

  if (!room) return null;

  const isHost = participantId === room.hostId;
  const roomCode = room.id;
  const readyCount = room.participants.filter(p => p.ready).length;
  const allReady = readyCount > 0 && readyCount === room.participants.length;

  const handleCopy = () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = (targetId: string) => {
    setKicking(targetId);
    kickParticipant(targetId);
    setKicking(null);
  };

  const handleStart = () => {
    onStart();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "radial-gradient(ellipse 80% 70% at 50% 30%, rgba(229,9,20,0.08) 0%, transparent 60%), #050505",
      overflowY: "auto",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 50,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(240,239,250,0.6)", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            <ChevronLeft size={16} /> Back to Landing
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 50,
              background: isConnected ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${isConnected ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
              fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
              color: isConnected ? "#10B981" : "#EF4444",
            }}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isConnected ? "Connected" : "Reconnecting..."}
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left column */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Room card */}
            <div style={{
              padding: "32px 36px", borderRadius: 24,
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <h2 style={{
                fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 28,
                color: "white", margin: "0 0 8px", letterSpacing: "-0.02em",
              }}>{room.name}</h2>
              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: 14,
                color: "rgba(240,239,250,0.5)", margin: "0 0 24px",
              }}>
                {room.participants.length} {room.participants.length !== 1 ? "people" : "person"} in the room
              </p>

              {/* Room code */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                padding: "10px 20px", borderRadius: 14,
                background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.2)",
                marginBottom: 8,
              }}>
                <span style={{
                  fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                  color: "rgba(240,239,250,0.4)", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>Room Code</span>
                <span style={{
                  fontFamily: "Inter,sans-serif", fontSize: 20, fontWeight: 800,
                  color: "white", letterSpacing: "0.08em",
                }}>{roomCode}</span>
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: "50%",
                    background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", transition: "background 0.2s",
                  }}
                  onMouseEnter={e => { if (!copied) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { if (!copied) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                >
                  {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} color="rgba(240,239,250,0.6)" />}
                </button>
              </div>

              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: 11,
                color: "rgba(240,239,250,0.3)", margin: "8px 0 0",
              }}>Share this code so others can join your room</p>
            </div>

            {/* Participants */}
            <div style={{
              padding: "24px 28px", borderRadius: 24,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
              }}>
                <div style={{
                  fontFamily: "Manrope,sans-serif", fontWeight: 700, fontSize: 16,
                  color: "white", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Users size={16} color="rgba(240,239,250,0.5)" />
                  Participants
                </div>
                <span style={{
                  fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600,
                  color: "rgba(229,9,20,0.7)",
                }}>{room.participants.length}</span>
              </div>

               <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                 {room.participants.map((p: Participant) => {
                   const isThisHost = p.id === room.hostId;
                   const isThisUser = p.id === participantId;
                   const isKicking = kicking === p.id;
                   return (
                     <div key={p.id} style={{
                       display: "flex", alignItems: "center", gap: 14,
                       padding: "10px 16px", borderRadius: 14,
                       background: "rgba(255,255,255,0.02)",
                       border: "1px solid rgba(255,255,255,0.04)",
                       transition: "all 0.3s ease",
                     }}>
                       <ParticipantAvatar name={p.name} isHost={isThisHost} isOnline={isConnected} />
                       <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{
                           fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 600,
                           color: "white", display: "flex", alignItems: "center", gap: 8,
                         }}>
                           {p.name}
                           {isThisHost && (
                             <span style={{
                               padding: "2px 8px", borderRadius: 50,
                               background: "rgba(245,158,11,0.12)",
                               color: "#F59E0B", fontSize: 10, fontWeight: 700,
                               fontFamily: "Inter,sans-serif", textTransform: "uppercase", letterSpacing: "0.04em",
                             }}>Host</span>
                           )}
                         </div>
                         <div style={{
                           fontFamily: "Inter,sans-serif", fontSize: 11,
                           color: "rgba(240,239,250,0.35)", marginTop: 2,
                         }}>Joined {new Date(p.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                       </div>

                       <div style={{
                         display: "flex", alignItems: "center", gap: 8,
                         fontFamily: "Inter,sans-serif", fontSize: 11, fontWeight: 600,
                         color: p.ready ? "#10B981" : "rgba(240,239,250,0.3)",
                       }}>
                         <div style={{
                           width: 8, height: 8, borderRadius: "50%",
                           background: p.ready ? "#10B981" : "rgba(240,239,250,0.2)",
                         }} />
                         {p.ready ? "Ready" : "Not ready"}
                       </div>

                       {isHost && !isThisHost && (
                         <button
                           onClick={() => handleKick(p.id)}
                           disabled={isKicking}
                           title="Kick participant"
                           style={{
                             display: "flex", alignItems: "center", justifyContent: "center",
                             width: 32, height: 32, borderRadius: "50%",
                             background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                             cursor: isKicking ? "not-allowed" : "pointer",
                             opacity: isKicking ? 0.5 : 0.7,
                             transition: "all 0.2s",
                           }}
                           onMouseEnter={e => { if (!isKicking) e.currentTarget.style.background = "rgba(239,68,68,0.18)"; }}
                           onMouseLeave={e => { if (!isKicking) e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                         >
                           {isKicking ? <Loader2 size={14} color="#EF4444" style={{ animation: "spin 0.8s linear infinite" }} /> : <UserX size={14} color="#EF4444" />}
                         </button>
                       )}
                     </div>
                   );
                 })}
               </div>
             </div>

              {/* Ready toggle for non-host participants */}
              {!isHost && (
                <div style={{
                  padding: "20px 28px", borderRadius: 24,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{
                      fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 500,
                      color: "rgba(240,239,250,0.7)",
                    }}>
                      {allReady ? "Everyone is ready!" : "Mark yourself as ready when you're set"}
                    </div>
                    <div style={{
                      fontFamily: "Inter,sans-serif", fontSize: 11,
                      color: "rgba(240,239,250,0.4)", marginTop: 2,
                    }}>
                      {readyCount > 0 ? `${readyCount} of ${room.participants.length} ready` : "Tap below to toggle ready status"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleReady()}
                    style={{
                      padding: "10px 22px", borderRadius: 50,
                      background: room.participants.find(p => p.id === participantId)?.ready
                        ? "rgba(16,185,129,0.15)"
                        : "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(16,185,129,0.1))",
                      color: "#10B981", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${room.participants.find(p => p.id === participantId)?.ready ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.2)"}`,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      const isReady = !!room.participants.find(p => p.id === participantId)?.ready;
                      if (!isReady) {
                        e.currentTarget.style.background = "linear-gradient(135deg,rgba(16,185,129,0.4),rgba(16,185,129,0.15))";
                        e.currentTarget.style.boxShadow = "0 0 20px rgba(16,185,129,0.3)";
                      }
                    }}
                    onMouseLeave={e => {
                      const isReady = !!room.participants.find(p => p.id === participantId)?.ready;
                      if (!isReady) {
                        e.currentTarget.style.background = "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(16,185,129,0.1))";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {room.participants.find(p => p.id === participantId)?.ready ? "✓ Ready" : "Mark Ready"}
                  </button>
                </div>
              )}

             {/* Host controls */}
             {isHost && (
               <div style={{
                 padding: "20px 28px", borderRadius: 24,
                 background: "linear-gradient(135deg, rgba(178,7,16,0.15), rgba(229,9,20,0.05))",
                 border: "1px solid rgba(229,9,20,0.2)",
                 display: "flex", alignItems: "center", justifyContent: "space-between",
               }}>
                 <div>
                   <div style={{
                     fontFamily: "Manrope,sans-serif", fontWeight: 700, fontSize: 15,
                     color: "white", display: "flex", alignItems: "center", gap: 8,
                   }}>
                     <Crown size={15} color="#F59E0B" /> Host Controls
                   </div>
                   <p style={{
                     fontFamily: "Inter,sans-serif", fontSize: 12,
                     color: "rgba(240,239,250,0.4)", margin: "4px 0 0",
                   }}>
                     {readyCount === room.participants.length
                       ? "Everyone is ready! Start the movie night."
                       : `${readyCount} of ${room.participants.length} ready — waiting for everyone`}
                   </p>
                 </div>
                 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                   {!allReady && (
                     <button
                       onClick={() => toggleReady()}
                        style={{
                          padding: "8px 16px", borderRadius: 50,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                         color: "rgba(240,239,250,0.7)", fontFamily: "Inter,sans-serif",
                         fontSize: 12, fontWeight: 600, cursor: "pointer",
                         transition: "all 0.2s",
                       }}
                       onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                       onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                     >
                       Mark Ready ({room.participants.find(p => p.id === participantId)?.ready ? "✓" : ""})
                     </button>
                   )}
                   <button
                     onClick={handleStart}
                     disabled={!allReady}
                     style={{
                       padding: "12px 28px", borderRadius: 50, border: "none",
                       background: allReady
                         ? "linear-gradient(135deg, #B20710, #E50914)"
                         : "rgba(229,9,20,0.15)",
                       color: allReady ? "white" : "rgba(240,239,250,0.3)",
                       fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 700,
                       cursor: allReady ? "pointer" : "not-allowed",
                       display: "flex", alignItems: "center", gap: 8,
                       boxShadow: allReady ? "0 0 24px rgba(229,9,20,0.4)" : "none",
                       transition: "all 0.2s ease",
                       opacity: allReady ? 1 : 0.5,
                     }}
                     onMouseEnter={e => { if (allReady) { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(229,9,20,0.6)"; } }}
                     onMouseLeave={e => { if (allReady) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(229,9,20,0.4)"; } }}
                   >
                     Start Room
                   </button>
                 </div>
               </div>
             )}

            {/* Error message */}
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", gap: 8,
                animation: "fade-in 0.3s",
              }}>
                <span style={{ color: "#EF4444", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 500, flex: 1 }}>
                  {error}
                </span>
                <button
                  onClick={dismissError}
                  style={{
                    background: "none", border: "none", color: "rgba(239,68,68,0.5)",
                    cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: 12,
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Right: Chat panel */}
          <div style={{ flexShrink: 0, width: 320 }}>
            <ChatPanel />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
       `}</style>
    </div>
  );
}
