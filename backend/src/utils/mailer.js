const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT, // usually 465 or 587
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password or app-specific password
  },
});

async function sendConfirmationEmail(to, username) {
  const info = await transporter.sendMail({
    from: `"Pokemon Trading" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Confirm your account",
    text: `Hello ${username},\n\nThank you for registering! Your account has been successfully created.\n\n- Pokemon Trading Team`,
    html: `<p>Hello <strong>${username}</strong>,</p>
           <p>Thank you for registering! Your account has been successfully created.</p>
           <p>- Pokemon Trading Team</p>`,
  });

  //console.log("Email sent:", info.messageId);
}

module.exports = { sendConfirmationEmail };
