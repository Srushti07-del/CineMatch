import { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ExternalLink,
  Star,
  Film,
  Maximize2,
  Minimize2,
  Tv,
  Play,
  Video,
  Info,
  X,
  Sparkles,
  Server,
} from "lucide-react";
import { useRoom } from "@/lib/RoomContext";
import type { Movie } from "../../../shared/types";
import {
  fetchMovieTrailerUrl,
  fetchWatchProviders,
  resolveTmdbId,
  MOVIE_STREAM_SERVERS,
  type StreamServer,
  type WatchProvidersResult,
} from "@/lib/tmdb";

type PlayMode = "movie" | "trailer";

export function WatchScreen({ onBack, movie }: { onBack: () => void; movie: Movie }) {
  const { leaveRoom } = useRoom();
  const [playMode, setPlayMode] = useState<PlayMode>("movie");
  const [selectedServer, setSelectedServer] = useState<StreamServer>(MOVIE_STREAM_SERVERS[0]);
  const [resolvedId, setResolvedId] = useState<number | null>(
    typeof movie.id === "number" && movie.id > 100 ? movie.id : null
  );
  const [isResolving, setIsResolving] = useState(!resolvedId);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(movie.trailerUrl || null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [watchProviders, setWatchProviders] = useState<WatchProvidersResult | null>(null);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamKey, setStreamKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Resolve actual TMDB movie ID
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await resolveTmdbId(movie.id, movie.title);
        if (cancelled) return;
        if (id) {
          setResolvedId(id);
        }
      } catch (err) {
        console.warn("[WatchScreen] Failed to resolve TMDB id:", err);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movie.id, movie.title]);

  // 2. Fetch watch providers from TMDB once ID is resolved
  useEffect(() => {
    const targetId = resolvedId || (typeof movie.id === "number" ? movie.id : null);
    if (!targetId) return;

    let cancelled = false;
    (async () => {
      try {
        const providers = await fetchWatchProviders(targetId);
        if (!cancelled && providers) {
          setWatchProviders(providers);
        }
      } catch (e) {
        console.warn("[WatchScreen] Failed to fetch providers:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedId, movie.id]);

  // 3. Fetch trailer when trailer mode is selected or on mount
  useEffect(() => {
    if (trailerUrl) return;
    const targetId = resolvedId || (typeof movie.id === "number" ? movie.id : null);
    if (!targetId) return;

    let cancelled = false;
    setTrailerLoading(true);
    (async () => {
      try {
        const url = await fetchMovieTrailerUrl(targetId);
        if (!cancelled) {
          setTrailerUrl(url);
        }
      } finally {
        if (!cancelled) setTrailerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedId, movie.id, trailerUrl]);

  // Auto-hide top and bottom bars after 4 seconds of idle
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (!showProvidersModal && !showInfoModal && !showServerMenu) {
        setShowControls(false);
      }
    }, 4000);
  }, [showProvidersModal, showInfoModal, showServerMenu]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [resetControlsTimer]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleLeave = () => {
    leaveRoom();
    onBack();
  };

  const currentTmdbId = resolvedId || (typeof movie.id === "number" ? movie.id : 693134);
  const currentStreamUrl = selectedServer.getUrl(currentTmdbId);

  // Available stream provider count
  const streamProviders = watchProviders?.flatrate || [];
  const rentBuyProviders = [...(watchProviders?.rent || []), ...(watchProviders?.buy || [])];

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "#050508",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
      onMouseMove={resetControlsTimer}
      onClick={() => {
        if (showServerMenu) setShowServerMenu(false);
      }}
    >
      {/* Top Navigation & Controls Bar */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          zIndex: 40,
          background:
            "linear-gradient(to bottom, rgba(5, 5, 8, 0.95) 0%, rgba(5, 5, 8, 0.7) 70%, transparent 100%)",
          backdropFilter: showControls ? "blur(16px)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: showControls ? 1 : 0,
          transform: showControls ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Left: Back & Room status */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleLeave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 50,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              backdropFilter: "blur(12px)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <ChevronLeft size={18} /> Back to Room
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 50,
              background: "rgba(229, 9, 20, 0.15)",
              border: "1px solid rgba(229, 9, 20, 0.3)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#E50914",
                boxShadow: "0 0 10px #E50914",
                animation: "pulse-glow 1.8s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#E50914",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {playMode === "movie" ? "STARTING MOVIE" : "TRAILER PREVIEW"}
            </span>
          </div>
        </div>

        {/* Center: Movie Title & Mode Switcher */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            maxWidth: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1
              style={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 900,
                fontSize: 17,
                color: "white",
                margin: 0,
                textShadow: "0 2px 14px rgba(0,0,0,0.8)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 280,
              }}
            >
              {movie.title}
            </h1>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                fontWeight: 500,
              }}
            >
              ({movie.year})
            </span>
            <button
              onClick={() => setShowInfoModal(true)}
              title="Movie Details"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                borderRadius: "50%",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              <Info size={16} />
            </button>
          </div>

          {/* Mode Switcher Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 50,
              padding: 3,
            }}
          >
            <button
              onClick={() => setPlayMode("movie")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 50,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background:
                  playMode === "movie"
                    ? "linear-gradient(135deg, #B20710, #E50914)"
                    : "transparent",
                color: playMode === "movie" ? "white" : "rgba(255,255,255,0.55)",
                boxShadow:
                  playMode === "movie" ? "0 0 16px rgba(229,9,20,0.5)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Play size={12} fill={playMode === "movie" ? "white" : "none"} /> Actual Movie
            </button>

            <button
              onClick={() => setPlayMode("trailer")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 50,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background:
                  playMode === "trailer"
                    ? "linear-gradient(135deg, #7C3AED, #9333EA)"
                    : "transparent",
                color: playMode === "trailer" ? "white" : "rgba(255,255,255,0.55)",
                boxShadow:
                  playMode === "trailer" ? "0 0 16px rgba(124,58,237,0.5)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Video size={12} /> Trailer
            </button>
          </div>
        </div>

        {/* Right: Server Switcher, Where to Watch & Fullscreen */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Server Switcher Dropdown (Only in Movie Mode) */}
          {playMode === "movie" && (
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowServerMenu(!showServerMenu);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 50,
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.85)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                }}
              >
                <Server size={14} color="#E50914" />
                <span>{selectedServer.name}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 10,
                    background: "rgba(229, 9, 20, 0.2)",
                    color: "#E50914",
                    fontWeight: 700,
                  }}
                >
                  {selectedServer.badge}
                </span>
              </button>

              {showServerMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 210,
                    background: "rgba(18, 18, 24, 0.96)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 16,
                    padding: 8,
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(20px)",
                    zIndex: 50,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Select Stream Server
                  </div>
                  {MOVIE_STREAM_SERVERS.map((server) => {
                    const isCurrent = server.id === selectedServer.id;
                    return (
                      <button
                        key={server.id}
                        onClick={() => {
                          setSelectedServer(server);
                          setStreamKey((prev) => prev + 1);
                          setShowServerMenu(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: isCurrent
                            ? "1px solid rgba(229, 9, 20, 0.4)"
                            : "1px solid transparent",
                          background: isCurrent
                            ? "rgba(229, 9, 20, 0.15)"
                            : "rgba(255, 255, 255, 0.03)",
                          color: isCurrent ? "#fff" : "rgba(255, 255, 255, 0.75)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: isCurrent ? "#E50914" : "rgba(255,255,255,0.2)",
                            }}
                          />
                          {server.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "rgba(255, 255, 255, 0.6)",
                          }}
                        >
                          {server.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Where to Stream Button */}
          <button
            onClick={() => setShowProvidersModal(true)}
            title="Official Streaming Services"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 50,
              background:
                streamProviders.length > 0
                  ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2))"
                  : "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "white",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(59,130,246,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Tv size={14} color="#60A5FA" />
            <span>Where to Watch</span>
            {streamProviders.length > 0 && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#3B82F6",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {streamProviders.length}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Player Screen Area */}
      <main
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          height: "100%",
          background: "#000",
          overflow: "hidden",
        }}
      >
        {isResolving ? (
          <ResolvingState movie={movie} />
        ) : playMode === "movie" ? (
          /* Actual Movie Embed Player */
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <iframe
              key={`${selectedServer.id}-${streamKey}-${currentTmdbId}`}
              src={currentStreamUrl}
              title={`${movie.title} - Full Movie`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                position: "absolute",
                inset: 0,
                backgroundColor: "#000",
              }}
            />
          </div>
        ) : (
          /* Trailer Player */
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            {trailerLoading ? (
              <ResolvingState movie={movie} message="Loading official trailer..." />
            ) : trailerUrl ? (
              <iframe
                src={`${trailerUrl}?autoplay=1&rel=0&modestbranding=1&showinfo=0&fs=1`}
                title={`${movie.title} - Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "#000",
                }}
              />
            ) : (
              <NoTrailerView
                movie={movie}
                onSwitchToMovie={() => setPlayMode("movie")}
                onOpenProviders={() => setShowProvidersModal(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Subtle Floating Bottom Helper (Auto-fading) */}
      <footer
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: showControls ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(14px)",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.35s ease, transform 0.35s ease",
          pointerEvents: showControls ? "auto" : "none",
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 18px",
            borderRadius: 50,
            background: "rgba(10, 10, 16, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
            Buffering or not loading?
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {MOVIE_STREAM_SERVERS.map((server, idx) => (
              <button
                key={server.id}
                onClick={() => {
                  setSelectedServer(server);
                  setStreamKey((p) => p + 1);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  border:
                    selectedServer.id === server.id
                      ? "1px solid #E50914"
                      : "1px solid rgba(255,255,255,0.08)",
                  background:
                    selectedServer.id === server.id
                      ? "rgba(229, 9, 20, 0.2)"
                      : "rgba(255,255,255,0.04)",
                  color: selectedServer.id === server.id ? "#fff" : "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Server {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Modal: Where to Watch / Official Streaming Providers */}
      {showProvidersModal && (
        <WhereToWatchModal
          movie={movie}
          providers={watchProviders}
          onClose={() => setShowProvidersModal(false)}
        />
      )}

      {/* Modal: Movie Details & Synopsis */}
      {showInfoModal && (
        <MovieDetailsModal movie={movie} onClose={() => setShowInfoModal(false)} />
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.85); }
        }
        @keyframes spin-stream {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes modal-in {
          0% { opacity: 0; transform: scale(0.96) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/** Cinematic Resolving / Connecting State */
function ResolvingState({ movie, message }: { movie: Movie; message?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: movie.backdropImg
          ? `linear-gradient(to top, #000 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.85) 100%), url(${movie.backdropImg}) center/cover`
          : "radial-gradient(ellipse at center, #180812 0%, #050508 80%)",
      }}
    >
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: "#E50914",
          animation: "spin-stream 0.9s linear infinite",
          marginBottom: 24,
          boxShadow: "0 0 25px rgba(229,9,20,0.3)",
        }}
      />
      <h3
        style={{
          fontFamily: "Manrope, sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "white",
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
        }}
      >
        {message || `Starting "${movie.title}"...`}
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          margin: 0,
        }}
      >
        Connecting to HD movie stream servers...
      </p>
    </div>
  );
}

/** "Where to Watch" Official Streaming Services Modal */
function WhereToWatchModal({
  movie,
  providers,
  onClose,
}: {
  movie: Movie;
  providers: WatchProvidersResult | null;
  onClose: () => void;
}) {
  const tmdbUrl =
    providers?.link || `https://www.themoviedb.org/movie/${movie.id}/watch`;
  const streamList = providers?.flatrate || [];
  const rentBuyList = [
    ...(providers?.rent || []),
    ...(providers?.buy || []),
  ].filter(
    (v, i, a) => a.findIndex((t) => t.provider_id === v.provider_id) === i
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 580,
          background: "linear-gradient(145deg, #161622 0%, #0d0d16 100%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 24,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(229, 9, 20, 0.15)",
          overflow: "hidden",
          animation: "modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tv size={18} color="#60A5FA" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "white",
                  margin: 0,
                }}
              >
                Where to Stream
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  margin: 0,
                }}
              >
                Official streaming platforms for {movie.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: 24, maxHeight: "65vh", overflowY: "auto" }}>
          {/* Subscription Streaming Platforms */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Sparkles size={14} color="#F59E0B" />
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Subscription Streaming
              </h3>
            </div>

            {streamList.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 10,
                }}
              >
                {streamList.map((p) => (
                  <a
                    key={p.provider_id}
                    href={tmdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      textDecoration: "none",
                      color: "white",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.09)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {p.logo_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#333",
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.provider_name}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                No flatrate subscription streaming detected. Check rent/buy options below or watch via the built-in player!
              </div>
            )}
          </div>

          {/* Rent or Buy */}
          {rentBuyList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.7)",
                  margin: "0 0 12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Rent or Purchase
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 10,
                }}
              >
                {rentBuyList.slice(0, 6).map((p) => (
                  <a
                    key={p.provider_id}
                    href={tmdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      textDecoration: "none",
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {p.logo_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.provider_name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Built-in Stream Notice */}
          <div
            style={{
              padding: "16px",
              borderRadius: 16,
              background: "rgba(229, 9, 20, 0.08)",
              border: "1px solid rgba(229, 9, 20, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2 }}>
                Watching inside CineMatch
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                The movie is already streaming right behind this modal!
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: 50,
                background: "linear-gradient(135deg, #B20710, #E50914)",
                border: "none",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Resume Player
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <a
            href={tmdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#60A5FA",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={13} /> View full details on JustWatch / TMDB
          </a>

          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 50,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Movie Details Modal */
function MovieDetailsModal({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          background: "linear-gradient(145deg, #181824 0%, #0e0e16 100%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 24,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          animation: "modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          gap: 24,
          padding: 28,
        }}
      >
        <img
          src={movie.img}
          alt={movie.title}
          style={{
            width: 170,
            height: 255,
            borderRadius: 16,
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: 24,
                fontWeight: 900,
                color: "white",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {movie.title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 16,
            }}
          >
            <span>{movie.genre}</span>
            <span>·</span>
            <span>{movie.year}</span>
            <span>·</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <span style={{ color: "#F59E0B", fontWeight: 700 }}>{movie.rating}</span>
            </div>
          </div>

          {movie.overview && (
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.6,
                margin: "0 0 20px",
                maxHeight: 130,
                overflowY: "auto",
              }}
            >
              {movie.overview}
            </p>
          )}

          {movie.tags && movie.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {movie.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 50,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fallback screen when trailer is not available */
function NoTrailerView({
  movie,
  onSwitchToMovie,
  onOpenProviders,
}: {
  movie: Movie;
  onSwitchToMovie: () => void;
  onOpenProviders: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, #1a0a14 0%, #050508 80%)",
        padding: 32,
        textAlign: "center",
      }}
    >
      <Film size={48} color="#E50914" style={{ marginBottom: 16 }} />
      <h3
        style={{
          fontFamily: "Manrope, sans-serif",
          fontWeight: 800,
          fontSize: 24,
          color: "white",
          margin: "0 0 8px",
        }}
      >
        No Trailer Available
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
          maxWidth: 420,
          margin: "0 0 24px",
          lineHeight: 1.6,
        }}
      >
        An official trailer wasn&apos;t found for {movie.title}, but you can start streaming the actual movie right now or see official platforms!
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onSwitchToMovie}
          style={{
            padding: "12px 24px",
            borderRadius: 50,
            background: "linear-gradient(135deg, #B20710, #E50914)",
            border: "none",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 0 24px rgba(229,9,20,0.4)",
          }}
        >
          ▶ Play Actual Movie
        </button>
        <button
          onClick={onOpenProviders}
          style={{
            padding: "12px 24px",
            borderRadius: 50,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Where to Stream
        </button>
      </div>
    </div>
  );
}