import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { verify } from "otplib";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const { token: userOtp, action } = await request.json();
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string };

    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Option to disable 2FA from UI
    if (action === "disable") {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      await user.save();
      return NextResponse.json({ message: "2FA has been disabled successfully." });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA setup was not initiated" }, { status: 400 });
    }

    // Verify 6-digit OTP (otplib v13 async syntax)
    const result = await verify({
      token: userOtp,
      secret: user.twoFactorSecret,
    });

    if (!result?.valid) {
      return NextResponse.json({ error: "Invalid 6-digit OTP code" }, { status: 400 });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return NextResponse.json({ message: "2FA enabled successfully!" });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}