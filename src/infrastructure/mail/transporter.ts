import nodemailer from 'nodemailer';
import env from '../../app/env';

export const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_PORT === 465, // true for 465, false for other ports
  auth:
    env.MAIL_USERNAME && env.MAIL_PASSWORD
      ? {
          user: env.MAIL_USERNAME,
          pass: env.MAIL_PASSWORD,
        }
      : undefined,
});

export default transporter;
