import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = request.headers.get("origin") || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=google_auth_failed`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error("Failed to get Google access token");
    }

    // 2. Fetch user profile from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();

    await connectDB();

    // 3. Find or Create User in MongoDB
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        provider: "google",
        googleId: googleUser.id,
        isVerified: true, // Google accounts are pre-verified
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // 4. Create JWT Cookie
    const token = jwt.sign(
      { userId: user._id, email: user.email },
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