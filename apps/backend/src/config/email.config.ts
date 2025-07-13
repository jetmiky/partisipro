import { registerAs } from '@nestjs/config';

export interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
}

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  baseUrl: string;
  templates: {
    investment: EmailTemplate;
    security: EmailTemplate;
    kyc: EmailTemplate;
    governance: EmailTemplate;
    system: EmailTemplate;
    mfa: EmailTemplate;
  };
  webhook: {
    secret: string;
    endpoint: string;
  };
  retries: {
    maxAttempts: number;
    delay: number;
  };
}

export default registerAs(
  'email',
  (): EmailConfig => ({
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@partisipro.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Partisipro',
    baseUrl: process.env.SENDGRID_BASE_URL || 'https://api.sendgrid.com',
    templates: {
      investment: {
        id: process.env.SENDGRID_TEMPLATE_INVESTMENT || 'd-investment-template',
        name: 'Investment Notifications',
        subject: 'Investment Update - Partisipro',
      },
      security: {
        id: process.env.SENDGRID_TEMPLATE_SECURITY || 'd-security-template',
        name: 'Security Alerts',
        subject: 'Security Alert - Partisipro',
      },
      kyc: {
        id: process.env.SENDGRID_TEMPLATE_KYC || 'd-kyc-template',
        name: 'KYC Status Updates',
        subject: 'KYC Verification Update - Partisipro',
      },
      governance: {
        id: process.env.SENDGRID_TEMPLATE_GOVERNANCE || 'd-governance-template',
        name: 'Governance Notifications',
        subject: 'Governance Update - Partisipro',
      },
      system: {
        id: process.env.SENDGRID_TEMPLATE_SYSTEM || 'd-system-template',
        name: 'System Notifications',
        subject: 'System Update - Partisipro',
      },
      mfa: {
        id: process.env.SENDGRID_TEMPLATE_MFA || 'd-mfa-template',
        name: 'MFA Codes',
        subject: 'Your Partisipro Security Code',
      },
    },
    webhook: {
      secret: process.env.SENDGRID_WEBHOOK_SECRET || '',
      endpoint: process.env.SENDGRID_WEBHOOK_ENDPOINT || '/api/email/webhook',
    },
    retries: {
      maxAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3', 10),
      delay: parseInt(process.env.EMAIL_RETRY_DELAY || '1000', 10),
    },
  })
);
