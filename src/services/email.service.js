import transporter from "../config/email.js";
import env from "../config/env.js";

// ─── Existing OTP sender (unchanged) ─────────────────────────────────────────
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
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Vidya Marg - Education Platform</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};


// ─── NEW: Enquiry notification to Institute Owner ─────────────────────────────
export const sendEnquiryEmailToOwner = async ({ ownerEmail, ownerName, enquiry, batch, course, institute }) => {
  const {
    studentSnapshot,
    message,
    preferredContactTime,
    willingToVisit,
    expectedJoiningDate,
  } = enquiry;

  const mailOptions = {
    from: `"Vidya Marg" <${env.smtp.user}>`,
    to: ownerEmail,
    subject: `New Enquiry for ${batch.batchName} - Vidya Marg`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
        
        <!-- Header -->
        <div style="background: #2563eb; padding: 20px 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">📚 New Student Enquiry</h1>
          <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 14px;">via Vidya Marg</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          
          <p style="color: #374151; font-size: 15px;">Hello <strong>${ownerName}</strong>,</p>
          <p style="color: #6b7280;">A student has submitted an enquiry for one of your batches. Here are the details:</p>

          <!-- Batch Info -->
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #1e40af; font-size: 15px;">📋 Batch Details</h3>
            <p style="margin: 4px 0; color: #374151;"><strong>Institute:</strong> ${institute.name}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Course:</strong> ${course.name}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Batch:</strong> ${batch.batchName}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Mode:</strong> ${batch.mode}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Timing:</strong> ${batch.timing}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Duration:</strong> ${batch.duration}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Seats Available:</strong> ${batch.seatsAvailable} / ${batch.totalSeats}</p>
          </div>

          <!-- Student Info -->
          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #15803d; font-size: 15px;">👤 Student Details</h3>
            <p style="margin: 4px 0; color: #374151;"><strong>Name:</strong> ${studentSnapshot.name}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Email:</strong> <a href="mailto:${studentSnapshot.email}" style="color: #2563eb;">${studentSnapshot.email}</a></p>
            <p style="margin: 4px 0; color: #374151;"><strong>Phone:</strong> <a href="tel:${studentSnapshot.phone}" style="color: #2563eb;">${studentSnapshot.phone}</a></p>
          </div>

          <!-- Enquiry Details -->
          <div style="background: #fefce8; border-left: 4px solid #ca8a04; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #92400e; font-size: 15px;">📝 Enquiry Details</h3>
            <p style="margin: 4px 0; color: #374151;"><strong>Preferred Contact Time:</strong> ${preferredContactTime}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Expected Joining:</strong> ${expectedJoiningDate}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Willing to Visit:</strong> ${willingToVisit ? "✅ Yes" : "❌ No"}</p>
            ${message ? `<p style="margin: 10px 0 4px; color: #374151;"><strong>Message:</strong></p>
            <p style="margin: 0; color: #4b5563; background: white; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">${message}</p>` : ""}
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 24px 0 8px;">
            <p style="color: #6b7280; font-size: 13px;">Please reach out to the student at your earliest convenience.</p>
          </div>

        </div>

        <!-- Footer -->
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 16px 0 0;">
          This enquiry was submitted via Vidya Marg. Do not reply to this email directly.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


// ─── NEW: Confirmation email to Student ──────────────────────────────────────
export const sendEnquiryConfirmationToStudent = async ({ studentEmail, studentName, batch, institute, course }) => {
  const mailOptions = {
    from: `"Vidya Marg" <${env.smtp.user}>`,
    to: studentEmail,
    subject: `Enquiry Submitted for ${batch.batchName} - Vidya Marg`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; text-align: center;">Vidya Marg</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Your enquiry has been successfully submitted! The institute will contact you shortly.</p>
        
        <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Institute:</strong> ${institute.name}</p>
          <p style="margin: 4px 0;"><strong>Course:</strong> ${course.name}</p>
          <p style="margin: 4px 0;"><strong>Batch:</strong> ${batch.batchName}</p>
          <p style="margin: 4px 0;"><strong>Mode:</strong> ${batch.mode}</p>
          <p style="margin: 4px 0;"><strong>Timing:</strong> ${batch.timing}</p>
        </div>

        <p style="color: #6b7280; font-size: 13px;">If you have further questions, you can submit another enquiry from the Vidya Marg app.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Vidya Marg - Education Platform</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};