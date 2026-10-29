import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name = "Hospital User", mode = "login" } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    let emailSent = false;
    let emailStatusMessage = "";

    // If Gmail credentials are provided in .env.local, send real email!
    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });

        const subject = `CarePulse Hospital - Verification OTP: ${otp}`;
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
              .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
              .header { text-align: center; margin-bottom: 24px; }
              .brand-title { font-size: 20px; font-weight: 700; color: #0284c7; margin-top: 8px; }
              .otp-badge { background: #eff6ff; border: 2px dashed #0284c7; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 6px; text-align: center; padding: 18px; margin: 24px 0; color: #0369a1; font-family: monospace; }
              .notice { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 20px; }
              .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div style="display:inline-block; width:44px; height:44px; background:#0284c7; border-radius:10px; line-height:44px; color:#ffffff; font-size:22px; text-align:center;">🏥</div>
                <div class="brand-title">CarePulse Hospital Management</div>
                <div style="font-size:12px; color:#64748b;">Healthcare Clinical Authentication</div>
              </div>
              <p>Hello <strong>${name}</strong>,</p>
              <p>Your one-time security verification code (OTP) for ${mode === "signup" ? "registering your account" : "signing in to your terminal"} is:</p>
              
              <div class="otp-badge">${otp}</div>
              
              <div class="notice">
                • This code expires in <strong>10 minutes</strong>.<br>
                • Do not share this code with anyone for medical confidentiality.<br>
                • If you did not request this verification, please contact hospital security.
              </div>
              
              <div class="footer">
                CarePulse Hospital Enterprise Network • Secure Medical EHR Platform
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"CarePulse Hospital Security" <${gmailUser}>`,
          to: email,
          subject,
          html,
        });

        emailSent = true;
        emailStatusMessage = `Verification OTP sent directly to your Gmail inbox (${email}).`;
      } catch (err: any) {
        console.error("[Email Delivery Error]:", err?.message || err);
        emailStatusMessage = `Generated OTP for ${email}. (Gmail SMTP check: ${err?.message || "Delivery delayed"})`;
      }
    } else {
      emailStatusMessage = `Generated OTP for ${email}. (Tip: Add GMAIL_USER & GMAIL_APP_PASSWORD to .env.local to send live emails directly from your Gmail)`;
    }

    return NextResponse.json({
      success: true,
      otp,
      email,
      emailSent,
      message: emailStatusMessage,
    });
  } catch (error: any) {
    console.error("[API Error /api/send-otp]:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error generating OTP code." },
      { status: 500 }
    );
  }
}
