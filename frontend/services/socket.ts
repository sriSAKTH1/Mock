// Socket.IO Client Configuration
// Change VITE_SERVER_ORIGIN in .env file to connect to different backend
import { io } from "socket.io-client";

// Server URL Configuration
// For local development: http://localhost:3001
// For production: https://your-backend-domain.com
export const SERVER_ORIGIN =
  (import.meta as any).env?.VITE_SERVER_ORIGIN || "http://localhost:3001";

// Socket.IO Connection with robust configuration
export const socket = io(SERVER_ORIGIN, {
  transports: ["websocket", "polling"],
  timeout: 5000,
  forceNew: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection event handlers
socket.on("connect", () => {
  console.log("✅ Connected to backend server:", SERVER_ORIGIN);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected from server:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error);
  console.warn("Make sure your backend server is running on:", SERVER_ORIGIN);
});
