import type { CreateRoomRequest, CreateRoomResponse, JoinRoomResponse, User } from "../../shared/types";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function createRoom(body: CreateRoomRequest): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message || "Failed to create room");
  }
  return res.json();
}

export async function getRoom(roomId: string): Promise<JoinRoomResponse> {
  const res = await fetch(`${API_BASE}/api/rooms/${roomId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message || "Failed to fetch room");
  }
  return res.json();
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message || "Failed to load session");
  }
  const data = await res.json();
  return data.user || null;
}

export async function register(body: { email: string; password: string; displayName?: string }): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message || "Registration failed");
  }
  return res.json();
}

export async function login(body: { email: string; password: string }): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message || "Login failed");
  }
  return res.json();
}

export async function logoutUser(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message || "Failed to log out");
  }
}

