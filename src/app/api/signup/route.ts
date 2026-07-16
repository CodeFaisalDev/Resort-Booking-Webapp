import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { fullName, email, password, phone, nationality, idProofNum } = await req.json();

    if (!fullName || !email || !password || !phone || !nationality || !idProofNum) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingGuest = await prisma.guest.findUnique({ where: { email } });
    if (existingGuest) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newGuest = await prisma.guest.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phone,
        nationality,
        idProofNum,
      },
    });

    return NextResponse.json({ message: "Guest created successfully", guestId: newGuest.id });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
