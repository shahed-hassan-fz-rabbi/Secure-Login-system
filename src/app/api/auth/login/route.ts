import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyCaptchaToken } from "@/lib/recaptcha";
import { checkRateLimit } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  captchaToken: z.string().min(1, "CAPTCHA token is required"),
});

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    const isAllowed = checkRateLimit(ip, 5, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data or CAPTCHA missing" },
        { status: 400 }
      );
    }

    const { email, password, captchaToken } = parsed.data;

    const isHuman = await verifyCaptchaToken(captchaToken);
    if (!isHuman) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 403 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.passwordHash || user.provider === "google") {
      return NextResponse.json(
        { error: "This account was created with Google. Please use 'Continue with Google'." },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email via the link sent to your inbox before logging in." },
        { status: 403 }
      );
    }

    // Two-Factor Authentication Check
    if (user.twoFactorEnabled) {
      return NextResponse.json({
        requires2FA: true,
        userId: user._id.toString(),
        message: "Two-factor authentication required",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      { message: "Login successful" },
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}