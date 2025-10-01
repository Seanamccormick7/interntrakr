import mongoose, { Document, Schema } from "mongoose";

// TypeScript interface for type safety
export interface IUser extends Document {
  email: string;
  password: string; // Will store bcrypt hash
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default in queries
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Indexes for performance
userSchema.index({ email: 1 }); // Already unique, but explicit index
userSchema.index({ createdAt: -1 }); // For sorting users by join date

// Prevent password from being returned in JSON
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete (ret as any).password;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
