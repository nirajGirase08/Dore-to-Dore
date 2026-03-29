import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your regular password)
  },
});

const AUTHORITY_EMAIL = 'niraj.girase@vanderbilt.edu';

export const notifyAuthorities = async (blockage) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email] EMAIL_USER / EMAIL_PASS not set — skipping authority notification');
    return false;
  }

  const { blockage_type, severity, location_address, location_lat, location_lng, description, blockage_id } = blockage;

  const typeLabel = blockage_type.replace(/_/g, ' ');
  const locLabel = location_address
    || (location_lat ? `${parseFloat(location_lat).toFixed(5)}, ${parseFloat(location_lng).toFixed(5)}` : 'Location not specified');

  const severityUpper = severity.toUpperCase();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severity === 'critical' ? '#dc2626' : '#ea580c'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${severityUpper} Road Hazard Reported</h2>
        <p style="margin: 6px 0 0; opacity: 0.9;">Crisis Connect — Vanderbilt Community Platform</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 140px;">Hazard Type</td>
            <td style="padding: 8px 0; font-weight: 600; text-transform: capitalize;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Severity</td>
            <td style="padding: 8px 0; font-weight: 600; color: ${severity === 'critical' ? '#dc2626' : '#ea580c'};">${severityUpper}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Location</td>
            <td style="padding: 8px 0;">${locLabel}</td>
          </tr>
          ${description ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Description</td>
            <td style="padding: 8px 0;">${description}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Report ID</td>
            <td style="padding: 8px 0; color: #9ca3af;">#${blockage_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Reported At</td>
            <td style="padding: 8px 0;">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #6b7280; font-size: 13px;">
          This is an automated alert from Crisis Connect. Please take appropriate action.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Crisis Connect" <${process.env.EMAIL_USER}>`,
    to: AUTHORITY_EMAIL,
    subject: `[${severityUpper}] Road Hazard Alert — ${typeLabel} at ${locLabel}`,
    html,
  });

  console.log(`[Email] Authority notification sent for blockage #${blockage_id} (${severity})`);
  return true;
};
