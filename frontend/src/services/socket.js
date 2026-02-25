import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;
let currentUserId = null;

export const getSocket = (userId) => {
  if (!userId) return null;
  if (socket && currentUserId && currentUserId !== userId) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      query: { userId },
      withCredentials: true
    });
    currentUserId = userId;
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};

