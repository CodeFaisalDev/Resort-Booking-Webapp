import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports (587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const mailOptions = {
    from: `"bookme.com" <${process.env.SMTP_USER || 'no-reply@bookme.com'}>`,
    to,
    subject,
    html,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[MAILER DEV FALLBACK] To: ${to} | Subject: ${subject}`);
    const codeMatch = html.match(/>(\d{6})</);
    if (codeMatch) {
      console.log(`[VERIFICATION CODE]: ${codeMatch[1]}`);
    }
    return { messageId: 'dev-fallback-message-id' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email via Nodemailer:', error);
    console.log(`[MAILER FALLBACK DUMP] To: ${to} | Subject: ${subject}`);
    const codeMatch = html.match(/>(\d{6})</);
    if (codeMatch) {
      console.log(`[VERIFICATION CODE]: ${codeMatch[1]}`);
    }
    return { messageId: 'error-fallback-message-id' };
  }
};
