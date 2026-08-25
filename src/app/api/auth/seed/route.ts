import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: "admin@example.com" });
    if (existingUser) {
      return NextResponse.json({ message: "Test user already exists!" });
    }

    const passwordHash = await bcrypt.hash("Password123!", 12);

    await User.create({
      email: "admin@example.com",
      passwordHash,
    });

    return NextResponse.json({ message: "Test user created successfully! (Email: admin@example.com, Password: Password123!)" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}