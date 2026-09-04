import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { createRoom as createRoomApi, getRoom as getRoomApi } from "@/lib/api";
import type { Room, Participant } from "../../shared/types";

interface RoomState {
  room: Room | null;
  participantId: string | null;
  participantName: string;
  isConnected: boolean;
  isCreating: boolean;
  error: string | null;
  messages: Array<{ id: string; participantId: string; participantName: string; text: string; createdAt: string }>;
  inCall: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface RoomContextValue extends RoomState {
  createRoom: (name: string, roomName?: string) => Promise<void>;
  joinRoom: (roomId: string, name: string) => Promise<void>;
  startRoom: () => Promise<void>;
  swipe: (movieId: string | number, direction: "like" | "skip") => void;
  addMovie: (movie: Room["movies"][number]) => void;
  selectGenre: (genre: string) => void;
  shuffleMovies: () => void;
  leaveRoom: () => void;
  dismissError: () => void;
  sendMessage: (text: string) => void;
  setInCall: (v: boolean) => void;
  setAudioEnabled: (v: boolean) => void;
  setVideoEnabled: (v: boolean) => void;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("You");
  const [isConnected, setIsConnected] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<RoomContextValue["messages"]>([]);
  const [inCall, setInCall] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const createRoom = useCallback(async (name: string, roomName?: string) => {
    setIsCreating(true);
    setError(null);
    try {
      const { room: newRoom } = await createRoomApi({ name: roomName, hostName: name });
      setRoom(newRoom);
      setParticipantId(newRoom.hostId);
      setParticipantName(name || "Host");

      const s = io(SOCKET_URL, { transports: ["websocket"], autoConnect: false });
      s.connect();
      setSocket(s);
      setIsConnected(true);

      s.emit("joinRoom", { roomId: newRoom.id, name: name || "Host" }, (res: { error?: string }) => {
        if (res?.error) {
          setError(res.error);
        }
      });

      s.on("participantJoined", (data: { participant: Participant }) => {
        setRoom(prev =>
          prev ? { ...prev, participants: [...prev.participants, data.participant] } : prev
        );
      });

      s.on("participantLeft", (data: { participantId: string }) => {
        setRoom(prev =>
          prev
            ? {
                ...prev,
                participants: prev.participants.filter(p => p.id !== data.participantId),
              }
            : prev
        );
      });

      s.on("matchFound", (data: { movie: Room["movies"][number] }) => {
        setRoom(prev =>
          prev ? { ...prev, status: "matched", matches: [...prev.matches, data.movie] } : prev
        );
      });

      s.on("swipeUpdate", (data: { participantId: string; movieId: string | number; direction: "like" | "skip"; votes: Record<string, "like" | "skip"> }) => {
        // Could update UI to show other participants' votes
      });

      s.on("roomUpdated", (data: { room: Room }) => {
        setRoom(data.room);
      });

      s.on("roomClosed", (data: { reason: string }) => {
        setError(`Room closed: ${data.reason}`);
        setRoom(null);
        setParticipantId(null);
        setIsConnected(false);
        s.disconnect();
        setSocket(null);
      });

      s.on("chatMessage", (data: { id: string; participantId: string; participantName: string; text: string; createdAt: string }) => {
        setMessages(prev => [...prev, data]);
      });

      s.on("genreSelected", (data: { room: Room }) => {
        setRoom(data.room);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  }, []);

  const joinRoomViaSocket = useCallback(async (roomId: string, name: string) => {
    setError(null);
    try {
      const { room: fetchedRoom } = await getRoomApi(roomId);
      setRoom(fetchedRoom);
      setParticipantName(name);

      const s = io(SOCKET_URL, { transports: ["websocket"], autoConnect: false });
      s.connect();
      setSocket(s);
      setIsConnected(true);

      s.emit("joinRoom", { roomId, name }, (res: { error?: string; participantId?: string; room?: Room }) => {
        if (res?.error) {
          setError(res.error);
        } else {
          if (res?.room) setRoom(res.room);
          if (res?.participantId) setParticipantId(res.participantId);
        }
      });

      s.on("participantJoined", (data: { participant: Participant }) => {
        setRoom(prev =>
          prev ? { ...prev, participants: [...prev.participants, data.participant] } : prev
        );
      });

      s.on("participantLeft", (data: { participantId: string }) => {
        setRoom(prev =>
          prev
            ? {
                ...prev,
                participants: prev.participants.filter(p => p.id !== data.participantId),
              }
            : prev
        );
      });

      s.on("matchFound", (data: { movie: Room["movies"][number] }) => {
        setRoom(prev =>
          prev ? { ...prev, status: "matched", matches: [...prev.matches, data.movie] } : prev
        );
      });

      s.on("swipeUpdate", (data: { participantId: string; movieId: string | number; direction: "like" | "skip"; votes: Record<string, "like" | "skip"> }) => {
        // Show partner's vote
      });

      s.on("roomUpdated", (data: { room: Room }) => {
        setRoom(data.room);
      });

      s.on("roomClosed", (data: { reason: string }) => {
        setError(`Room closed: ${data.reason}`);
        setRoom(null);
        setParticipantId(null);
        setIsConnected(false);
        s.disconnect();
        setSocket(null);
      });

      s.on("chatMessage", (data: { id: string; participantId: string; participantName: string; text: string; createdAt: string }) => {
        setMessages(prev => [...prev, data]);
      });

      s.on("genreSelected", (data: { room: Room }) => {
        setRoom(data.room);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join room");
    }
  }, []);

  const startRoom = useCallback(async () => {
    if (!room || !socket) return;
    socket.emit("startRoom", { roomId: room.id });
  }, [room, socket]);

  const swipe = useCallback(
    (movieId: string | number, direction: "like" | "skip") => {
      if (!room || !socket || !participantId) return;
      socket.emit("swipe", { roomId: room.id, participantId, movieId, direction });
    },
    [room, socket, participantId]
  );

  const addMovie = useCallback(
    (movie: Room["movies"][number]) => {
      if (!room || !socket) return;
      socket.emit("addMovie", { roomId: room.id, movie });
    },
    [room, socket]
  );

  const selectGenre = useCallback(
    (genre: string) => {
      if (!room || !socket) return;
      socket.emit("selectGenre", { roomId: room.id, genre });
    },
    [room, socket]
  );

  const shuffleMovies = useCallback(() => {
    if (!room || !socket) return;
    socket.emit("shuffleMovies", { roomId: room.id });
  }, [room, socket]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!room || !socket || !participantId || !text.trim()) return;
      const payload = {
        roomId: room.id,
        participantId,
        participantName: participantName || "You",
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      socket.emit("chatMessage", payload);
    },
    [room, socket, participantId, participantName]
  );

  const leaveRoom = useCallback(() => {
    if (socket && room) {
      socket.emit("leaveRoom", { roomId: room.id, participantId: participantId || "" });
      socket.disconnect();
    }
    setRoom(null);
    setParticipantId(null);
    setIsConnected(false);
    setSocket(null);
    setMessages([]);
    setInCall(false);
    setAudioEnabled(true);
    setVideoEnabled(true);
  }, [socket, room, participantId]);

  const dismissError = useCallback(() => setError(null), []);

  const value: RoomContextValue = {
    room,
    participantId,
    participantName,
    isConnected,
    isCreating,
    error,
    createRoom,
    joinRoom: joinRoomViaSocket,
    startRoom,
    swipe,
    addMovie,
    selectGenre,
    shuffleMovies,
    leaveRoom,
    dismissError,
    messages,
    inCall,
    audioEnabled,
    videoEnabled,
    sendMessage,
    setInCall,
    setAudioEnabled,
    setVideoEnabled,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
