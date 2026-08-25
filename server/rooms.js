import { v4 as uuidv4 } from "uuid";
import { SWIPE_MOVIES } from "./movies.js";

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

export class RoomStore {
  constructor() {
    this.rooms = new Map();
    this.pruneInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, room] of this.rooms) {
        if (now - new Date(room.updatedAt).getTime() > ROOM_TTL_MS) {
          this.deleteRoom(id, "expired");
        }
      }
    }, 60 * 1000);
  }

  createRoom({ name, hostName }) {
    const hostId = this._genId();
    const roomId = this._genShortId();
    const room = {
      id: roomId,
      name: name || `Movie Night ${roomId.slice(0, 5)}`,
      hostId,
      participants: [
        { id: hostId, name: hostName || "Host", joinedAt: new Date().toISOString() },
      ],
      movies: SWIPE_MOVIES,
      currentMovieIndex: 0,
      matches: [],
      status: "waiting",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.updatedAt = new Date().toISOString();
    return room;
  }

  addParticipant(roomId, { name }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const participantId = this._genId();
    room.participants.push({
      id: participantId,
      name: name || `Guest ${participantId.slice(0, 5)}`,
      joinedAt: new Date().toISOString(),
    });
    room.updatedAt = new Date().toISOString();
    return { room, participantId };
  }

  removeParticipant(roomId, participantId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.participants = room.participants.filter(p => p.id !== participantId);
    room.updatedAt = new Date().toISOString();
    if (room.participants.length === 0) {
      this.deleteRoom(roomId, "no participants");
    }
    return true;
  }

  startRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.status = "started";
    room.updatedAt = new Date().toISOString();
    return room;
  }

  recordSwipe(roomId, participantId, movieId, direction) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (!room.votes) room.votes = {};
    if (!room.votes[movieId]) room.votes[movieId] = {};
    room.votes[movieId][participantId] = direction;
    room.updatedAt = new Date().toISOString();

    const currentMovieId = room.movies[room.currentMovieIndex]?.id;
    const votes = room.votes[currentMovieId] || {};
    const allVoted =
      room.participants.length > 0 &&
      room.participants.every(p => votes[p.id] !== undefined);

    if (allVoted) {
      const likes = room.participants.filter(p => votes[p.id] === "like");
      if (likes.length === room.participants.length && currentMovieId) {
        const matchedMovie = room.movies[room.currentMovieIndex];
        room.matches.push(matchedMovie);
        room.status = "matched";
        room.currentMovieIndex += 1;
        room.votes = {};
        return { room, matchedMovie, allVoted: true };
      } else {
        room.currentMovieIndex += 1;
        room.votes = {};
        return { room, allVoted: true };
      }
    }
    return { room, allVoted: false };
  }

  deleteRoom(roomId, reason = "manual") {
    const existed = this.rooms.delete(roomId);
    return existed;
  }

  _genId() {
    return uuidv4();
  }

  _genShortId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
