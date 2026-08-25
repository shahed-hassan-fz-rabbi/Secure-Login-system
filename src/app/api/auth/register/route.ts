import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendVerificationEmail } from "@/lib/mail";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");

    await User.create({
      email,
      passwordHash,
      isVerified: false,
      verifyToken: hashedVerifyToken,
      verifyTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const verifyUrl = `${origin}/verify-email?token=${rawVerifyToken}`;

    // send verification email
    await sendVerificationEmail(email, verifyUrl);

    return NextResponse.json(
      { message: "Registration successful! Please check your Gmail to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Failed to complete registration or send email" },
      { status: 500 }
    );
  }
}