import { emailQueue } from '../queues/email.queue';
import env from '../../app/env';

interface MailUser {
  fname?: string;
  name?: string;
  email: string;
}

interface MemberParams {
  user: MailUser;
  member: MailUser;
  url: string;
}

interface OtpParams {
  name: string;
  email: string;
  otp: string;
}

interface VerificationParams {
  email: string;
  name: string;
  token: string;
  type: string;
}

export class MailService {
  async sendMemberInvitation({
    user,
    member,
    url,
  }: MemberParams): Promise<void> {
    try {
      const from = `${env.APP_NAME} <${env.MAIL_FROM_ADDRESS}>`;
      const subject = `${user.fname || user.name || 'Someone'} is inviting you to ${env.APP_NAME}`;

      await emailQueue.add('sendMemberInvitation', {
        to: member.email,
        from,
        subject,
        template: 'verify', // using verify.ejs as a fallback/template
        context: {
          name: member.name || 'Member',
          verificationLink: url,
        },
      });
    } catch (error) {
      console.error('Error queuing member invitation email:', error);
    }
  }

  async sendOtpCodeToEmail({ name, email, otp }: OtpParams): Promise<void> {
    try {
      const from = `${env.APP_NAME} <${env.MAIL_FROM_ADDRESS}>`;
      const subject = 'Email Verification';

      await emailQueue.add('sendOtpCodeToEmail', {
        to: email,
        from,
        subject,
        template: 'verify',
        context: {
          name,
          otp,
        },
      });
    } catch (error) {
      console.error('Error queuing OTP email:', error);
    }
  }

  async sendVerificationLink(params: VerificationParams): Promise<void> {
    try {
      const from = `${env.APP_NAME} <${env.MAIL_FROM_ADDRESS}>`;
      const verificationLink = `${env.CLIENT_APP_URL}/verify-email?token=${params.token}&email=${params.email}&type=${params.type}`;

      await emailQueue.add('sendVerificationLink', {
        to: params.email,
        from,
        subject: 'Verify Your Email',
        template: 'verify',
        context: {
          name: params.name,
          verificationLink,
        },
      });
    } catch (error) {
      console.error('Error queuing verification link email:', error);
    }
  }
}

export const mailService = new MailService();
export default mailService;
