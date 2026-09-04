import { useEffect, useState, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { useRoom } from "@/lib/RoomContext";

export function ChatPanel() {
  const { room, sendMessage, messages, participantId } = useRoom();
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!chatText.trim()) return;
    sendMessage(chatText.trim());
    setChatText("");
  };

  if (!room) return null;

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      height: "calc(100vh - 140px)",
      display: "flex",
      flexDirection: "column",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20,
      overflow: "hidden",
    }}>
      {/* Chat header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #B20710, #E50914)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MessageCircle size={15} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: "Manrope,sans-serif", fontWeight: 700, fontSize: 14, color: "white" }}>Room Chat</div>
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: 11, color: "rgba(240,239,250,0.4)" }}>
            {room.participants.length} member{room.participants.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "36px 20px",
            color: "rgba(240,239,250,0.32)",
            fontFamily: "Inter,sans-serif",
            fontSize: 13,
          }}>
            No messages yet. Say hi!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.participantId === participantId;
          const participant = room.participants.find((p) => p.id === msg.participantId);
          const pColor = participant
            ? `hsl(${(participant.name.charCodeAt(0) * 13 + participant.name.charCodeAt(0) * 7) % 360}, 55%, 45%)`
            : "rgba(255,255,255,0.2)";
          const pInitial = participant?.name?.[0] || "?";
          const pName = participant?.name || "Unknown";
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: isOwn ? "row-reverse" : "row",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: pColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white",
                flexShrink: 0,
                fontFamily: "Inter,sans-serif",
              }}>
                {pInitial}
              </div>
              <div style={{
                maxWidth: "75%",
                padding: "8px 12px",
                borderRadius: isOwn ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: isOwn ? "linear-gradient(135deg, #B20710, #E50914)" : "rgba(255,255,255,0.06)",
                color: "white",
                fontFamily: "Inter,sans-serif",
                fontSize: 13,
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}>
                {!isOwn && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(240,239,250,0.55)", marginBottom: 2 }}>
                    {pName}
                  </div>
                )}
                {msg.text}
                <div style={{
                  fontSize: 9,
                  color: isOwn ? "rgba(255,255,255,0.5)" : "rgba(240,239,250,0.28)",
                  marginTop: 2,
                  textAlign: "right",
                }}>
                  {new Date(msg.createdAt || new Date().toISOString()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div style={{
        padding: "12px 14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}>
        <input
          type="text"
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          maxLength={500}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 50,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontFamily: "Inter,sans-serif",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!chatText.trim()}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: chatText.trim() ? "linear-gradient(135deg, #B20710, #E50914)" : "rgba(255,255,255,0.04)",
            border: "none",
            color: chatText.trim() ? "white" : "rgba(240,239,250,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: chatText.trim() ? "pointer" : "not-allowed",
            transition: "background 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => { if (chatText.trim()) e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
