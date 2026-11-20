
import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Remove /api to get the Socket.io server URL
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socket = null;

// Connect to Socket.io server
export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
  });

  return socket;
};

// Get existing socket connection
export const getSocket = () => socket;

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
