import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Session } from "@/models/Session";

const JWT_SECRET = process.env.JWT_SECRET!;
const MAX_DEVICES = 2; // Maximum allowed concurrent devices

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=google_auth_failed`);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange authorization code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error("Failed to retrieve access token from Google");
    }

    // 2. Fetch user information
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();

    await connectDB();

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        provider: "google",
        googleId: googleUser.id,
        isVerified: true,
      });
    } else {
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (!user.googleId) {
        user.googleId = googleUser.id;
      }
      await user.save();
    }

    // 3. Check Active Device Sessions Limit
    const activeSessionsCount = await Session.countDocuments({ userId: user._id });
    if (activeSessionsCount >= MAX_DEVICES) {
      return NextResponse.redirect(
        `${origin}/?error=device_limit_reached&message=Maximum+${MAX_DEVICES}+devices+allowed.+Please+logout+from+another+device.`
      );
    }

    // 4. Create New Device Session
    const sessionId = crypto.randomUUID();
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Google Auth Device";

    await Session.create({
      userId: user._id,
      sessionId,
      userAgent,
      ipAddress: ip,
      lastActive: new Date(),
    });

    // 5. Create Session JWT with sessionId
    const token = jwt.sign(
      { userId: user._id, email: user.email, sessionId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.redirect(`${origin}/dashboard`);
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
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    return NextResponse.redirect(`${origin}/?error=google_login_error`);
  }
}