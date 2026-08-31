import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Session } from "@/models/Session";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      sessionId?: string;
    };

    await connectDB();

    // Verify session existence in database if sessionId exists
    if (decoded.sessionId) {
      const activeSession = await Session.findOne({ sessionId: decoded.sessionId });
      if (!activeSession) {
        return NextResponse.json(
          { error: "Session has been terminated from another device." },
          { status: 401 }
        );
      }

      // Update last active time
      activeSession.lastActive = new Date();
      await activeSession.save();
    }

    const user = await User.findById(decoded.userId).select("email name twoFactorEnabled");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}