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

  createRoom({ name, hostName, genre, movies, hostId: providedHostId }) {
    const hostId = providedHostId || this._genId();
    const roomId = this._genShortId();
    const room = {
      id: roomId,
      name: name || `Movie Night ${roomId.slice(0, 5)}`,
      genre: genre || "Trending",
      hostId,
      participants: [
        { id: hostId, name: hostName || "Host", joinedAt: new Date().toISOString(), ready: false },
      ],
      movies: movies !== undefined ? movies : [],
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

  addParticipant(roomId, { name, accountId }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const participantId = accountId || this._genId();
    room.participants.push({
      id: participantId,
      name: name || `Guest ${participantId.slice(0, 5)}`,
      joinedAt: new Date().toISOString(),
      ready: false,
    });
    room.updatedAt = new Date().toISOString();
    return { room, participantId };
  }

  setReady(roomId, participantId, ready) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const participant = room.participants.find(p => p.id === participantId);
    if (!participant) return null;
    participant.ready = ready;
    room.updatedAt = new Date().toISOString();
    return room;
  }

  kickParticipant(roomId, participantId, kickedById) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.participants = room.participants.filter(p => p.id !== participantId);
    room.updatedAt = new Date().toISOString();
    if (room.participants.length === 0) {
      this.deleteRoom(roomId, "no participants");
    }
    return { room, participantId, kickedById };
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
    if (room.participants.length === 0) return null;
    const readyCount = room.participants.filter(p => p.ready).length;
    if (readyCount === 0) return null;
    room.status = "started";
    room.updatedAt = new Date().toISOString();
    room.participants.forEach(p => { p.ready = false; });
    return room;
  }

  recordSwipe(roomId, participantId, movieId, direction) {
    const room = this.rooms.get(roomId);
    if (!room || !room.movies || room.movies.length === 0) return null;
    if (!room.votes) room.votes = {};
    if (!room.votes[movieId]) room.votes[movieId] = {};
    room.votes[movieId][participantId] = direction;
    room.updatedAt = new Date().toISOString();

    // Check if ALL participants have voted on THIS specific movie
    const movieVotes = room.votes[movieId] || {};
    const allVotedOnThisMovie =
      room.participants.length > 0 &&
      room.participants.every(p => movieVotes[p.id] !== undefined);

    let matchedMovie = null;
    if (allVotedOnThisMovie) {
      const likes = room.participants.filter(p => movieVotes[p.id] === "like");
      const movie = room.movies.find(m => String(m.id) === String(movieId));
      if (likes.length === room.participants.length && movie) {
        matchedMovie = movie;
        room.matches.push(matchedMovie);
        room.status = "matched";
      }
      // Clear votes for this movie only (not all votes)
      delete room.votes[movieId];
    }

    // Do NOT advance room.currentMovieIndex — each client tracks its own position
    return { room, matchedMovie, allVoted: allVotedOnThisMovie, movieId };
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
