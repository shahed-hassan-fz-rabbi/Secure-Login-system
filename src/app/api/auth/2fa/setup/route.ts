import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate TOTP Secret and QR Code URI (otplib v13 syntax)
    const secret = generateSecret();
    const otpauth = generateURI({
      issuer: "Comilla University",
      label: user.email,
      secret,
    });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    // Save temporary secret to user document
    user.twoFactorSecret = secret;
    await user.save();

    return NextResponse.json({
      secret,
      qrCodeUrl,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate 2FA setup" }, { status: 500 });
  }
}