import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { WebSocketContext } from "./WebSocketContext";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("access_token");

    if (!token) {
      // No token, don't connect
      return;
    }

    // Create socket connection with JWT auth
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("WebSocket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []); // Re-run if token changes by monitoring localStorage changes

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
