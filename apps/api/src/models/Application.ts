// apps/api/src/models/Application.ts

import mongoose, { Document, Schema } from "mongoose";
import { ApplicationStatus } from "../types/application.types";

// Re-export for backward compatibility
export { ApplicationStatus };

// TypeScript interface
export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  collaborators: string[];
  company: string;
  role: string;
  location?: string;
  link?: string;
  status: ApplicationStatus;
  deadline?: Date;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    collaborators: {
      type: [String],
      default: [],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+/,
        "Please provide a valid URL starting with http:// or https://",
      ],
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.SAVED,
      index: true,
    },
    deadline: {
      type: Date,
      index: true,
    },
    notes: {
      type: String,
      maxlength: [5000, "Notes cannot exceed 5000 characters"],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for common queries
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ userId: 1, deadline: 1 });
applicationSchema.index({ userId: 1, company: 1 });
applicationSchema.index({ deadline: 1, status: 1 });

// Text index for full-text search
applicationSchema.index({ company: "text", role: "text", notes: "text" });

export const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema,
);
