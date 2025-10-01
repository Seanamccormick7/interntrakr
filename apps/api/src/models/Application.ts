import mongoose, { Document, Schema } from "mongoose";

// Status enum matches the plan
export enum ApplicationStatus {
  SAVED = "SAVED",
  APPLIED = "APPLIED",
  OA = "OA",
  INTERVIEW = "INTERVIEW",
  REJECTED = "REJECTED",
  OFFER = "OFFER",
}

// TypeScript interface
export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  collaborators: string[]; // Array of user IDs who can view/edit
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
      index: true, // Index for querying by user
    },
    collaborators: {
      type: [String],
      default: [],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true, // Index for searching by company
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
      index: true, // Index for filtering by status
    },
    deadline: {
      type: Date,
      index: true, // Index for deadline queries (upcoming deadlines)
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
applicationSchema.index({ userId: 1, status: 1 }); // Filter user's apps by status
applicationSchema.index({ userId: 1, deadline: 1 }); // User's upcoming deadlines
applicationSchema.index({ userId: 1, company: 1 }); // Search by company within user's apps
applicationSchema.index({ deadline: 1, status: 1 }); // Global deadline alerts

// Text index for full-text search on company, role, and notes
applicationSchema.index({ company: "text", role: "text", notes: "text" });

export const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema,
);
