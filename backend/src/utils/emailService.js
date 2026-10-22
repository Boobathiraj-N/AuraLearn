
const nodemailer = require("nodemailer");

const sendStaffActivationEmail = async ({ email, name, role, activationUrl }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error("Email credentials are missing in the environment.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"AuraLearn AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Activate your AuraLearn AI staff account",
    text: `
Hello ${name},

Your AuraLearn AI ${role} account has been created.

Click the link below to set your password and activate your account:

${activationUrl}

This link expires in 15 minutes. If you did not expect this invitation, you can ignore this email.

AuraLearn AI Team
    `,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#111827">
        <h2 style="color:#7c3aed">Welcome to AuraLearn AI!</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Your <strong>${escapeHtml(role)}</strong> staff account has been created.</p>
        <p>Click below to set your password and activate your account.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(activationUrl)}"
             style="background:#7c3aed;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px">
            Activate Account
          </a>
        </p>
        <p>This link expires in 15 minutes and can be used only once.</p>
        <p>If you weren't expecting this invitation, you can ignore this email.</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#6b7280;font-size:12px">AuraLearn AI Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

module.exports = { sendStaffActivationEmail };
