const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, text, html }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // Must be verified sender
    subject,
    text,
    html,
  };
  await sgMail.send(msg);
}

module.exports = { sendEmail };
