import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true, unique: true },
    userAgent: { type: String, default: "Unknown Device" },
    ipAddress: { type: String, default: "Unknown IP" },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Session = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);