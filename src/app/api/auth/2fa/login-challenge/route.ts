import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verify } from "otplib";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

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
        { error: "2FA is not properly configured for this account" },
        { status: 400 }
      );
    }

    // Verify 6-digit OTP code against the user's secret
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

    // Generate Final Session JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      { message: "2FA Verification successful! Redirecting..." },
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