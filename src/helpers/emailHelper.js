const nodemailer = require("nodemailer");

// Create reusable transporter using GoDaddy SMTP
const transporter = nodemailer.createTransport({
  host: process.env.GODADDY_SMTP_HOST || "smtpout.secureserver.net",
  port: process.env.GODADDY_SMTP_PORT || 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.GODADDY_SMTP_USER,
    pass: process.env.GODADDY_SMTP_PASS,
  },
});

/**
 * Send an email using GoDaddy SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.GODADDY_FROM_EMAIL, // Must be your GoDaddy sender
    to,
    subject,
    text,
    html,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
