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

/**
 * Send a branded Petoye OTP email (HTML and text)
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.otpValue - OTP code
 * @param {string} opts.purpose - Purpose for OTP (e.g. 'verify your email', 'reset your password')
 * @param {string} [opts.subject] - Optional subject override
 */
async function sendOtpEmail({ to, otpValue, purpose, subject }) {
  const finalSubject = subject || `Your Petoye OTP Code`;
  const text = `Welcome to Petoye!\n\nYour OTP code is: ${otpValue}\n\nUse this code to ${purpose}.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style=\"font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;\">
      <div style=\"background: #2d7cff; color: #fff; padding: 24px 20px 12px 20px; text-align: center;\">
        <img src=\"https://your-domain.com/assets/petoye-logo.png\" alt=\"Petoye Logo\" style=\"height: 56px; margin-bottom: 10px;\" />
        <h2 style=\"margin: 0; font-size: 1.7em; letter-spacing: 1px;\">Welcome to Petoye!</h2>
      </div>
      <div style=\"padding: 24px 20px 20px 20px; background: #fafbfc;\">
        <p style=\"font-size: 1.1em; color: #222; margin-bottom: 18px;\">Your OTP code is:</p>
        <div style=\"font-size: 2.2em; font-weight: bold; color: #2d7cff; letter-spacing: 6px; margin-bottom: 18px;\">${otpValue}</div>
        <p style=\"color: #444; margin-bottom: 18px;\">Use this code to ${purpose}.</p>
        <p style=\"font-size: 0.97em; color: #888;\">If you did not request this, you can safely ignore this email.</p>
        <div style=\"margin-top: 30px; text-align: center;\">
          <span style=\"font-size: 1.1em; color: #2d7cff; font-weight: 600;\">Petoye Team</span>
        </div>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: finalSubject, text, html });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
};
