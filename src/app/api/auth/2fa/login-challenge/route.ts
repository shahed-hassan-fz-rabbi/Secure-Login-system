import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verify } from "otplib";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Session } from "@/models/Session";

const JWT_SECRET = process.env.JWT_SECRET!;
const MAX_DEVICES = 2;

export async function POST(request: Request) {
  try {
    const { userId, token: otpCode } = await request.json();

    if (!userId || !otpCode) {
      return NextResponse.json(
        { error: "User ID and 6-digit OTP are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA is not configured for this account" },
        { status: 400 }
      );
    }

    const result = await verify({
      token: otpCode,
      secret: user.twoFactorSecret,
    });

    if (!result?.valid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    // Check device limit
    const activeSessionsCount = await Session.countDocuments({ userId: user._id });
    if (activeSessionsCount >= MAX_DEVICES) {
      return NextResponse.json(
        { error: `Device limit reached. Maximum ${MAX_DEVICES} devices allowed.` },
        { status: 403 }
      );
    }

    // Create session record
    const sessionId = crypto.randomUUID();
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Device";

    await Session.create({
      userId: user._id,
      sessionId,
      userAgent,
      ipAddress: ip,
      lastActive: new Date(),
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, sessionId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      { message: "2FA Verification successful" },
      { status: 200 }
    );

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error during 2FA challenge" },
      { status: 500 }
    );
  }
}