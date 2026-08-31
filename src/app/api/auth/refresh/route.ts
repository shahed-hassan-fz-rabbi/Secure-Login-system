import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { RefreshToken } from "@/models/RefreshToken";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export async function POST() {
  const cookieStore = await cookies();
  const rawRefreshToken = cookieStore.get("refresh_token")?.value;

  if (!rawRefreshToken) {
    return NextResponse.json({ error: "Refresh token missing" }, { status: 401 });
  }

  try {
    await connectDB();

    // 1. Verify Refresh Token signature
    const decoded = jwt.verify(rawRefreshToken, REFRESH_SECRET) as { userId: string; email: string };

    // 2. Hash incoming token to match database
    const incomingHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

    // 3. Find token in DB
    const existingToken = await RefreshToken.findOne({ tokenHash: incomingHash, userId: decoded.userId });

    // REUSE DETECTION: If token not found, it was already used/compromised!
    if (!existingToken) {
      await RefreshToken.deleteMany({ userId: decoded.userId }); // Invalidate all sessions
      const response = NextResponse.json(
        { error: "Compromised session. Please log in again." },
        { status: 403 }
      );
      response.cookies.delete("auth_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    // 4. Invalidate old token (Rotation)
    await RefreshToken.deleteOne({ _id: existingToken._id });

    // 5. Generate NEW Access & Refresh Token Pair
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    const newRefreshTokenRaw = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Save NEW token in DB
    const newHash = crypto.createHash("sha256").update(newRefreshTokenRaw).digest("hex");
    await RefreshToken.create({
      userId: decoded.userId,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // 7. Set HTTP-Only cookies
    const response = NextResponse.json({ message: "Token refreshed successfully" });
    
    response.cookies.set({
      name: "auth_token",
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 mins
    });

    response.cookies.set({
      name: "refresh_token",
      value: newRefreshTokenRaw,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid refresh session" }, { status: 401 });
  }
}