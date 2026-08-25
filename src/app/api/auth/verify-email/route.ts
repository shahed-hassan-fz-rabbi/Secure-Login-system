import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await connectDB();

    
    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpires: { $gt: new Date() },
    });

    
    if (!user) {
      return NextResponse.json(
        { message: "Email is already verified or token expired. You can sign in." },
        { status: 200 }
      );
    }

    
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Your email has been verified successfully!" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}