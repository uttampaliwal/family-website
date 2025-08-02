import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail app password
  },
  secure: true, // Use TLS
  requireTLS: true, // Require TLS connection
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender address
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    const logData = {
      level: 'info',
      message: 'Email sent successfully',
      to: options.to.replace(/[\n\r\t]/g, ''),
      subject: options.subject.replace(/[\n\r\t]/g, ''),
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(logData));
  } catch (error) {
    const errorData = {
      level: 'error',
      message: 'Failed to send email',
      to: options.to.replace(/[\n\r\t]/g, ''),
      subject: options.subject.replace(/[\n\r\t]/g, ''),
      error: error instanceof Error ? error.message.replace(/[\n\r\t]/g, '') : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    console.error(JSON.stringify(errorData));
    throw new Error('Failed to send email');
  }
};
