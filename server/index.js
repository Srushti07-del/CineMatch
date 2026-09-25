import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { RoomStore } from "./rooms.js";
import { getRoomMovies } from "./tmdb.js";

const PORT = process.env.PORT || 4000;
const ORIGIN = (process.env.ORIGIN || "http://localhost:5173").replace(/\/$/, "");
const API_ORIGIN = (process.env.API_ORIGIN || `http://localhost:${PORT}`).replace(/\/$/, "");
const CLIENT_URL = (process.env.CLIENT_URL || ORIGIN).replace(/\/$/, "");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = (process.env.GOOGLE_REDIRECT_URI || `${API_ORIGIN}/api/auth/google/callback`).replace(/\/$/, "");
const SESSION_COOKIE = "cinematch_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const ACCOUNTS_FILE = join(dirname(fileURLToPath(import.meta.url)), "data", "accounts.json");

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));

const store = new RoomStore();
const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
const accountsByGoogleId = new Map();
const accountsByEmail = new Map();
const accountsById = new Map();
const passwordHashes = new Map();
const sessions = new Map();
const oauthStates = new Map();
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [...new Set([ORIGIN, CLIENT_URL])];
let accountsWriteQueue = Promise.resolve();

const loadAccounts = async () => {
  try {
    const raw = await readFile(ACCOUNTS_FILE, "utf8");
    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts)) return;

    for (const account of accounts) {
      if (!account?.email) continue;
      const normalizedEmail = account.email.trim().toLowerCase();
      const restored = {
        ...account,
        email: normalizedEmail,
        picture: account.picture || null,
        provider: account.provider || "google",
      };
      if (restored.googleId) {
        accountsByGoogleId.set(restored.googleId, restored);
      }
      accountsById.set(restored.id, restored);
      accountsByEmail.set(normalizedEmail, restored);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("[auth] Failed to load accounts", error);
    }
  }
};

const persistAccounts = () => {
  const payload = JSON.stringify([...accountsByGoogleId.values()], null, 2);
  const writeAccounts = async () => {
    await mkdir(dirname(ACCOUNTS_FILE), { recursive: true });
    const temporaryFile = `${ACCOUNTS_FILE}.tmp`;
    await writeFile(temporaryFile, payload, "utf8");
    await rename(temporaryFile, ACCOUNTS_FILE);
  };

  accountsWriteQueue = accountsWriteQueue.then(writeAccounts, writeAccounts);
  return accountsWriteQueue;
};

const toPublicUser = (account) => ({
  id: account.id,
  displayName: account.displayName,
  email: account.email,
  picture: account.picture,
  provider: account.provider,
});

const createSession = (res, account) => {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, {
    accountId: account.id,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
    signed: true,
  });
};

const clearSession = (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
};

const getAccountFromSession = (req) => {
  const token = req.signedCookies?.[SESSION_COOKIE];
  if (!token) return null;

  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessions.delete(token);
    return null;
  }

  return accountsById.get(session.accountId) || null;
};

const redirectAuthStatus = (res, status) => {
  const url = new URL(CLIENT_URL);
  url.searchParams.set("auth", status);
  res.redirect(url.toString());
};

const getGoogleProfile = async (accessToken) => {
  if (!accessToken) return {};
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  return response.json();
};

const findOrCreateGoogleAccount = async (profile) => {
  const googleId = profile.sub;
  const email = profile.email?.trim().toLowerCase();
  if (!googleId || !email) {
    throw new Error("Google profile did not include the required account details");
  }
  if (profile.email_verified === false) {
    throw new Error("Google email address is not verified");
  }

  let account = accountsByGoogleId.get(googleId) || (email && accountsByEmail.get(email));
  const now = new Date().toISOString();

  if (!account) {
    account = {
      id: randomUUID(),
      googleId,
      displayName: profile.name || profile.given_name || email.split("@")[0],
      email,
      picture: profile.picture || null,
      provider: "google",
      createdAt: now,
      updatedAt: now,
    };
    accountsByGoogleId.set(googleId, account);
    accountsById.set(account.id, account);
    accountsByEmail.set(email, account);
    await persistAccounts();
    return account;
  }

  const previousGoogleId = account.googleId;
  const previousEmail = account.email;
  account.googleId = googleId;
  account.displayName = profile.name || profile.given_name || account.displayName || email.split("@")[0];
  account.email = email;
  account.picture = profile.picture || account.picture || null;
  account.provider = "google";
  account.updatedAt = now;
  if (previousGoogleId && previousGoogleId !== googleId) accountsByGoogleId.delete(previousGoogleId);
  if (previousEmail && previousEmail !== email) accountsByEmail.delete(previousEmail.toLowerCase());
  accountsByGoogleId.set(googleId, account);
  accountsById.set(account.id, account);
  accountsByEmail.set(email, account);
  await persistAccounts();
  return account;
};

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    scrypt(password, "cinematch_salt", 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

function verifyPassword(password, hashHex) {
  return new Promise((resolve) => {
    scrypt(password, "cinematch_salt", 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        resolve(timingSafeEqual(derivedKey, Buffer.from(hashHex, "hex")));
      } catch {
        resolve(false);
      }
    });
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
  for (const [state, expiresAt] of oauthStates) {
    if (expiresAt <= now) oauthStates.delete(state);
  }
}, 60 * 60 * 1000).unref();

// ── REST API ──────────────────────────────────────────────

app.get("/api/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return redirectAuthStatus(res, "error");
  }

  const state = randomBytes(16).toString("hex");
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    include_granted_scopes: true,
    prompt: "select_account",
  });

  return res.redirect(authUrl);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return redirectAuthStatus(res, error === "access_denied" ? "cancelled" : "error");
  }

  if (typeof code !== "string" || typeof state !== "string") {
    return redirectAuthStatus(res, "error");
  }

  const stateExpiresAt = oauthStates.get(state);
  oauthStates.delete(state);
  if (!stateExpiresAt || stateExpiresAt <= Date.now()) {
    return redirectAuthStatus(res, "error");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.id_token) {
      throw new Error("Google did not return an ID token");
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const claims = ticket.getPayload();
    const profile = await getGoogleProfile(tokens.access_token);
    const account = await findOrCreateGoogleAccount({ ...claims, ...profile });

    createSession(res, account);
    return redirectAuthStatus(res, "success");
  } catch (error) {
    console.error("[auth] Google sign-in failed", error);
    return redirectAuthStatus(res, "error");
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (accountsByEmail.has(normalizedEmail)) {
    return res.status(409).json({ message: "Email already registered" });
  }
  try {
    const hash = await hashPassword(password);
    const account = {
      id: randomUUID(),
      googleId: null,
      displayName: displayName || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      picture: null,
      provider: "password",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    accountsById.set(account.id, account);
    accountsByEmail.set(normalizedEmail, account);
    passwordHashes.set(normalizedEmail, hash);
    await persistAccounts();
    createSession(res, account);
    return res.status(201).json({ user: toPublicUser(account) });
  } catch (error) {
    console.error("[auth] Registration failed", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const account = accountsByEmail.get(normalizedEmail);
  const storedHash = passwordHashes.get(normalizedEmail);
  if (!account || !storedHash) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const valid = await new Promise((resolve) => {
    scrypt(password, "cinematch_salt", 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        resolve(timingSafeEqual(derivedKey, Buffer.from(storedHash, "hex")));
      } catch {
        resolve(false);
      }
    });
  });
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  createSession(res, account);
  return res.json({ user: toPublicUser(account) });
});

app.get("/api/auth/me", (req, res) => {
  const account = getAccountFromSession(req);
  if (!account) {
    return res.status(401).json({ user: null });
  }

  return res.json({ user: toPublicUser(account) });
});

app.post("/api/auth/logout", (req, res) => {
  clearSession(req, res);
  return res.json({ success: true });
});

app.post("/api/rooms", async (req, res) => {
  const { name, hostName, hostId } = req.body || {};
  const room = store.createRoom({ name, hostName, hostId });
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
  cors: { origin: allowedOrigins, credentials: true },
});
app.io = io;

io.on("connection", (socket) => {
  console.log(`[socket] ${socket.id} connected`);

  socket.on("joinRoom", ({ roomId, name, accountId }, cb) => {
    const room = store.getRoom(roomId);
    if (!room) {
      cb && cb({ error: "Room not found" });
      return;
    }

    const existing = accountId
      ? room.participants.find(p => p.id === accountId)
      : room.participants.find(p => p.name === (name || "").trim());
    if (existing) {
      socket.join(`room:${roomId}`);
      socket.data.roomId = roomId;
      socket.data.participantId = existing.id;
      cb && cb({ room, participantId: existing.id });
      return;
    }

    const result = store.addParticipant(roomId, { name, accountId });
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

  socket.on("hostJoin", ({ roomId, participantId }) => {
    const room = store.getRoom(roomId);
    if (!room) return;
    socket.join(`room:${roomId}`);
    socket.data.roomId = roomId;
    socket.data.participantId = participantId;
  });

  socket.on("kick", ({ roomId, participantId, kickedById }, cb) => {
    const room = store.getRoom(roomId);
    if (!room) {
      cb && cb({ error: "Room not found" });
      return;
    }
    if (room.hostId !== kickedById) {
      cb && cb({ error: "Only the host can kick participants" });
      return;
    }
    const result = store.kickParticipant(roomId, participantId, kickedById);
    if (!result) {
      cb && cb({ error: "Failed to kick participant" });
      return;
    }
    io.to(`room:${roomId}`).emit("participantKicked", { participantId, kickedById, room: result.room });
    cb && cb({ room: result.room });
  });

  socket.on("leaveRoom", ({ roomId, participantId }) => {
    store.removeParticipant(roomId, participantId);
    socket.to(`room:${roomId}`).emit("participantLeft", { participantId });
    socket.leave(`room:${roomId}`);
  });

  socket.on("ready", ({ roomId, participantId, ready }) => {
    const room = store.setReady(roomId, participantId, ready);
    if (room) {
      const participant = room.participants.find(p => p.id === participantId);
      if (participant) {
        io.to(`room:${roomId}`).emit("participantReady", { participantId, ready });
      }
    }
  });

  socket.on("startRoom", ({ roomId }, cb) => {
    const room = store.getRoom(roomId);
    if (!room) {
      cb && cb({ error: "Room not found" });
      return;
    }
    if (room.participants.length === 0) {
      cb && cb({ error: "Room is empty" });
      return;
    }
    const readyCount = room.participants.filter(p => p.ready).length;
    if (readyCount === 0) {
      cb && cb({ error: "No one is ready yet" });
      return;
    }
    const startedRoom = store.startRoom(roomId);
    if (startedRoom) {
      io.to(`room:${roomId}`).emit("roomStarted", { room: startedRoom });
      cb && cb({ room: startedRoom });
    }
  });

  socket.on("chatMessage", (data) => {
    const { roomId } = data || {};
    if (!roomId) return;
    io.to(`room:${roomId}`).emit("chatMessage", {
      ...data,
      id: data.id || `${Date.now()}-${socket.id}`,
      createdAt: data.createdAt || new Date().toISOString(),
    });
  });

  socket.on("swipe", ({ roomId, participantId, movieId, direction }) => {
    const result = store.recordSwipe(roomId, participantId, movieId, direction);
    if (!result) {
      socket.emit("roomClosed", { reason: "Room no longer exists" });
      return;
    }
    const { room, matchedMovie, allVoted } = result;

    // Notify all participants about this swipe (for vote indicators)
    // but do NOT send roomUpdated — each client tracks their own card index
    io.to(`room:${roomId}`).emit("swipeUpdate", {
      participantId,
      movieId,
      direction,
    });

    if (allVoted && matchedMovie) {
      io.to(`room:${roomId}`).emit("matchFound", { movie: matchedMovie, votes: {} });
    }
  });

  socket.on("addMovie", ({ roomId, movie }) => {
    const room = store.getRoom(roomId);
    if (!room) {
      socket.emit("roomClosed", { reason: "Room no longer exists" });
      return;
    }
    room.movies.push(movie);
    room.updatedAt = new Date().toISOString();
    io.to(`room:${roomId}`).emit("roomUpdated", { room });
  });

  socket.on("selectGenre", async ({ roomId, genre }) => {
    const room = store.getRoom(roomId);
    if (!room) {
      socket.emit("roomClosed", { reason: "Room no longer exists" });
      return;
    }
    const movies = await getRoomMovies(genre);
    room.movies = movies;
    room.genre = genre;
    room.currentMovieIndex = 0;
    room.votes = {};
    room.status = "waiting";
    room.updatedAt = new Date().toISOString();
    io.to(`room:${roomId}`).emit("genreSelected", { room });
  });

  socket.on("shuffleMovies", async ({ roomId }) => {
    const room = store.getRoom(roomId);
    if (!room || !room.genre) {
      socket.emit("roomClosed", { reason: "Room no longer exists" });
      return;
    }
    const excludeIds = room.movies.map((m) => String(m.id));
    const movies = await getRoomMovies(room.genre, excludeIds);
    room.movies = movies;
    room.currentMovieIndex = 0;
    room.votes = {};
    room.status = "waiting";
    room.updatedAt = new Date().toISOString();
    io.to(`room:${roomId}`).emit("roomUpdated", { room });
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

await loadAccounts();

server.listen(PORT, () => {
  console.log(`[server] CineMatch backend running on port ${PORT}`);
});
