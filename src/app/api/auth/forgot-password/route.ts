import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendResetPasswordEmail } from "@/lib/mail";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "If that email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    if (process.env.EMAIL_SERVER_USER) {
      try {
        await sendResetPasswordEmail(email, resetUrl);
      } catch (mailError) {
        console.error("Email sending failed:", mailError);
      }
    } else {
      console.log(`\n=========================================\n[DEV RESET LINK]: ${resetUrl}\n=========================================\n`);
    }

    return NextResponse.json(
      {
        message: "If that email exists, a reset link has been sent.",
        devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}