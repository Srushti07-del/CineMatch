import type { CreateRoomRequest, CreateRoomResponse, JoinRoomResponse } from "../shared/types";

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
