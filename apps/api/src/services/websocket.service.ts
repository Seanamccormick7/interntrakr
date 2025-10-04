import { getIO } from "../config/socket";
import { IApplication } from "../models/Application";

export class WebSocketService {
  // Broadcast application creation to user and collaborators
  broadcastApplicationCreated(application: IApplication) {
    try {
      const io = getIO();
      const rooms = this.getRoomsForApplication(application);

      rooms.forEach((room) => {
        io.to(room).emit("application:created", {
          application: application.toObject(),
        });
      });

      console.log(`Broadcasted application:created to rooms:`, rooms);
    } catch (error) {
      console.error("WebSocket broadcast error:", error);
    }
  }

  // Broadcast application update to user and collaborators
  broadcastApplicationUpdated(application: IApplication) {
    try {
      const io = getIO();
      const rooms = this.getRoomsForApplication(application);

      rooms.forEach((room) => {
        io.to(room).emit("application:updated", {
          application: application.toObject(),
        });
      });

      console.log(`Broadcasted application:updated to rooms:`, rooms);
    } catch (error) {
      console.error("WebSocket broadcast error:", error);
    }
  }

  // Broadcast application deletion to user and collaborators
  broadcastApplicationDeleted(
    applicationId: string,
    userId: string,
    collaborators: string[],
  ) {
    try {
      const io = getIO();
      const rooms = [
        `user:${userId}`,
        ...collaborators.map((id) => `user:${id}`),
      ];

      rooms.forEach((room) => {
        io.to(room).emit("application:deleted", {
          applicationId,
        });
      });

      console.log(`Broadcasted application:deleted to rooms:`, rooms);
    } catch (error) {
      console.error("WebSocket broadcast error:", error);
    }
  }

  // Get all rooms that should receive updates for an application
  private getRoomsForApplication(application: IApplication): string[] {
    const rooms = [`user:${application.userId.toString()}`];

    // Add collaborator rooms
    if (application.collaborators && application.collaborators.length > 0) {
      application.collaborators.forEach((collaboratorId) => {
        rooms.push(`user:${collaboratorId}`);
      });
    }

    return rooms;
  }
}

export const websocketService = new WebSocketService();
