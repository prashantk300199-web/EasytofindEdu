import transporter from "../config/email.js";
import env from "../config/env.js";

export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Vidya Marg" <${env.smtp.user}>`,
    to: email,
    subject: "Your Verification Code - Vidya Marg",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; text-align: center;">Vidya Marg</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <div style="background: #f0f4ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Vidya Marg - Hostel Listing Platform</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};