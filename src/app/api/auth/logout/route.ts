import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { Session } from "@/models/Session";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { sessionId?: string };
        if (decoded.sessionId) {
          await connectDB();
          await Session.findOneAndDelete({ sessionId: decoded.sessionId });
        }
      } catch {
        // Token invalid, proceed to clear cookie
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}