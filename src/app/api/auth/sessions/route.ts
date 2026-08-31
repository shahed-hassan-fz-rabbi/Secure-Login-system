import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { Session } from "@/models/Session";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
    await connectDB();

    // ইউজারের সব সক্রিয় ডিভাইস লিস্ট আনা
    const sessions = await Session.find({ userId: decoded.userId }).sort({ lastActive: -1 });

    const formattedSessions = sessions.map((s) => ({
      id: s._id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isCurrent: s.sessionId === decoded.sessionId, // বর্তমান ডিভাইস কি না
      lastActive: s.lastActive,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}