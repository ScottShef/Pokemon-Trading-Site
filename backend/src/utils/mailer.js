
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendConfirmationEmail(to, username) {
  try {
    const info = await transporter.sendMail({
      from: `"Pokemon Trading" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Confirm your account",
      text: `Hello ${username},\n\nThank you for registering! Your account has been successfully created.\n\n- Pokemon Trading Team`,
      html: `<p>Hello <strong>${username}</strong>,</p>
             <p>Thank you for registering! Your account has been successfully created.</p>
             <p>- Pokemon Trading Team</p>`,
    });
    // console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // Depending on your app's needs, you might want to re-throw the error
    // or handle it silently.
  }
}

// --- Key change is here ---
export { sendConfirmationEmail };

