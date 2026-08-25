import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomStore } from "./rooms.js";
import { getRoomMovies } from "./tmdb.js";

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

const store = new RoomStore();

// ── REST API ──────────────────────────────────────────────

app.post("/api/rooms", async (req, res) => {
  const { name, hostName, genre } = req.body || {};
  const movies = await getRoomMovies(genre);
  const room = store.createRoom({ name, hostName, genre, movies });
  return res.status(201).json({ room });
});

app.get("/api/rooms/:id", (req, res) => {
  const room = store.getRoom(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  return res.json({ room });
});

app.delete("/api/rooms/:id", (req, res) => {
  const { hostId } = req.query;
  const room = store.getRoom(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (hostId && room.hostId !== hostId) {
    return res.status(403).json({ message: "Only the host can delete this room" });
  }
  store.deleteRoom(req.params.id);
  req.app.io.to(`room:${req.params.id}`).emit("roomClosed", { reason: "host deleted" });
  return res.json({ success: true });
});

// ── Socket.IO ─────────────────────────────────────────────

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN },
});
app.io = io;

io.on("connection", (socket) => {
  console.log(`[socket] ${socket.id} connected`);

  socket.on("joinRoom", ({ roomId, name }, cb) => {
    const room = store.getRoom(roomId);
    if (!room) {
      cb && cb({ error: "Room not found" });
      return;
    }
    const result = store.addParticipant(roomId, { name });
    if (!result) {
      cb && cb({ error: "Failed to join room" });
      return;
    }
    const participantId = result.participantId;
    const updatedRoom = result.room;
    const participant = updatedRoom.participants[updatedRoom.participants.length - 1];

    socket.join(`room:${roomId}`);
    socket.data.roomId = roomId;
    socket.data.participantId = participantId;

    cb && cb({ room: updatedRoom, participantId });
    socket.to(`room:${roomId}`).emit("participantJoined", { participant });
  });

  socket.on("leaveRoom", ({ roomId, participantId }) => {
    store.removeParticipant(roomId, participantId);
    socket.to(`room:${roomId}`).emit("participantLeft", { participantId });
    socket.leave(`room:${roomId}`);
  });

  socket.on("startRoom", ({ roomId }) => {
    const room = store.startRoom(roomId);
    if (room) {
      io.to(`room:${roomId}`).emit("roomStarted", { room });
    }
  });

  socket.on("swipe", ({ roomId, participantId, movieId, direction }) => {
    const result = store.recordSwipe(roomId, participantId, movieId, direction);
    if (!result) {
      socket.emit("roomClosed", { reason: "Room no longer exists" });
      return;
    }
    const { room, matchedMovie, allVoted } = result;
    const votesIdx = Math.max(0, room.currentMovieIndex - (allVoted ? 1 : 0));
    const currentMovieId = room.movies[votesIdx]?.id;

    const votes = room.votes[currentMovieId] || {};
    io.to(`room:${roomId}`).emit("swipeUpdate", {
      participantId,
      movieId,
      direction,
      votes: { ...votes },
    });

    if (allVoted && matchedMovie) {
      io.to(`room:${roomId}`).emit("matchFound", { movie: matchedMovie, votes: {} });
    }
  });

  socket.on("disconnect", () => {
    const { roomId, participantId } = socket.data;
    if (roomId && participantId) {
      store.removeParticipant(roomId, participantId);
      io.to(`room:${roomId}`).emit("participantLeft", { participantId });
    }
    console.log(`[socket] ${socket.id} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`[server] CineMatch backend running on port ${PORT}`);
});
