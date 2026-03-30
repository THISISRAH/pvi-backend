import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      console.warn('⚠️ Email not configured — skipping send to:', options.to);
      console.log(`📧 Would send: Subject="${options.subject}" To=${options.to}`);
      return true; // Return true in dev so flows don't break
    }

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`📧 Email sent to ${options.to}`);
    return true;
  } catch (err) {
    console.error('❌ Email send error:', err);
    return false;
  }
}

export function buildOTPEmail(name: string, otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a5f2a;">People's Voice Initiative</h2>
      <p>Hello ${name},</p>
      <p>Your verification code is:</p>
      <div style="background: #f0f7f1; border: 2px solid #1a5f2a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a5f2a;">${otp}</span>
      </div>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #888; font-size: 12px;">People's Voice Initiative — Together for a better Nigeria.</p>
    </div>
  `;
}
