export interface User {
  id: string;
  displayName: string;
  email: string;
  picture?: string | null;
  provider: "google" | "password";
}

export interface Movie {
  id: number | string;
  title: string;
  genre: string;
  year: number;
  rating: number;
  matchPct?: number;
  img: string;
  backdropImg?: string;
  overview?: string;
  tags?: string[];
  trailerUrl?: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  ready: boolean;
}

export type RoomStatus = "waiting" | "started" | "matched" | "closed";

export interface Room {
  id: string;
  name: string;
  genre?: string;
  hostId: string;
  participants: Participant[];
  movies: Movie[];
  currentMovieIndex: number;
  matches: Movie[];
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name?: string;
  hostName?: string;
  hostId?: string;
  genre?: string;
}

export interface CreateRoomResponse {
  room: Room;
}

export interface JoinRoomResponse {
  room: Room;
}

// Socket events
export interface SocketEvents {
  // Client -> Server
  joinRoom: (payload: { roomId: string; name: string; accountId?: string }) => void;
  ready: (payload: { roomId: string; participantId: string; ready: boolean }) => void;
  kick: (payload: { roomId: string; participantId: string; kickedById: string }) => void;
  leaveRoom: (payload: { roomId: string; participantId: string }) => void;
  swipe: (payload: { roomId: string; participantId: string; movieId: string | number; direction: "like" | "skip" }) => void;
  startRoom: (payload: { roomId: string }) => void;
  // Server -> Client
  roomJoined: (data: { room: Room; participantId: string }) => void;
  participantJoined: (data: { participant: Participant }) => void;
  participantReady: (data: { participantId: string; ready: boolean }) => void;
  participantLeft: (data: { participantId: string }) => void;
  participantKicked: (data: { participantId: string; kickedById: string; room: Room }) => void;
  roomStarted: (data: { room: Room }) => void;
  swipeUpdate: (data: { participantId: string; movieId: string | number; direction: "like" | "skip"; votes: Record<string, "like" | "skip"> }) => void;
  matchFound: (data: { movie: Movie; votes: Record<string, "like" | "skip"> }) => void;
  roomClosed: (data: { reason: string }) => void;
}
