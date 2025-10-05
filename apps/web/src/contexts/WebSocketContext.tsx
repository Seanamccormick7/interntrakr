import { createContext } from "react";
import { Socket } from "socket.io-client";

export interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});
