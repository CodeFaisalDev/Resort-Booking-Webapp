import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendMail } from "@/lib/mailer";

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[@$!%*?&]/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&).';
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Password restrictions validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }

    const existingGuest = await prisma.guest.findUnique({ where: { email } });
    if (existingGuest && existingGuest.isVerified) {
      return NextResponse.json({ error: "Email already registered and verified. Please log in." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Generate 6-digit verification code and 15-minute expiry
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    let targetGuest;

    if (existingGuest && !existingGuest.isVerified) {
      // Update existing unverified guest with new password & code
      targetGuest = await prisma.guest.update({
        where: { email },
        data: {
          fullName,
          password: hashedPassword,
          verificationCode,
          verificationExpires
        }
      });
    } else {
      // Create unverified Guest profile in database
      targetGuest = await prisma.guest.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          phone: "",
          nationality: "",
          idProofNum: "",
          isVerified: false,
          verificationCode,
          verificationExpires
        },
      });
    }

    // 4. Send email confirmation code
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #78350f; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 24px; letter-spacing: 2px;">BOOKME.COM</h2>
        <p style="text-align: center; color: #a8a29e; font-size: 12px; text-transform: uppercase;">Email Verification Portal</p>
        <hr style="border: 0; border-top: 1px solid #292524; margin: 25px 0;" />
        
        <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${fullName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">Thank you for registering at bookme.com. To activate your account, please enter the following verification code:</p>
        
        <div style="background-color: #1c1917; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #78350f;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fbbf24;">${verificationCode}</span>
        </div>
        
        <p style="font-size: 11px; color: #a8a29e; text-align: center;">
          This code will expire in 15 minutes. If you did not request this account registration, please disregard this email.
        </p>
      </div>
    `;

    console.log(`Sending verification email code to: ${email}`);
    await sendMail({
      to: email,
      subject: "Email Verification Code - bookme.com",
      html: htmlBody
    });

    return NextResponse.json({ 
      message: "Guest registered successfully. Please verify your email.",
      needsVerification: true,
      email: targetGuest.email 
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
