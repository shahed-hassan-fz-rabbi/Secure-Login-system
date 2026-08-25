import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const mailOptions = {
    from: `"Comilla University Secure Auth" <${process.env.EMAIL_SERVER_USER}>`,
    to,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Email Verification</h2>
        <p style="color: #374151; font-size: 15px;">Welcome! Please click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This verification link will expire in 24 hours.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  const mailOptions = {
    from: `"Comilla University Secure Auth" <${process.env.EMAIL_SERVER_USER}>`,
    to,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #fed7aa; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #374151; font-size: 15px;">You recently requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email. The link expires in 1 hour.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}