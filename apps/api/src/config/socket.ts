import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { env } from "./env";

let io: SocketIOServer | null = null;

export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // JWT authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} (socket: ${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId} (socket: ${socket.id})`);
    });
  });

  console.log("Socket.IO initialized with CORS origins:", env.ALLOWED_ORIGINS);
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
