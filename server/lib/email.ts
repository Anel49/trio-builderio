import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { pool } from "../routes/db";

const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_SES_REGION || "us-east-2";
const fromEmail = process.env.AWS_SES_FROM_EMAIL || "noreply@lendit.com";

// Log configuration on startup (without exposing secrets)
console.log("[Email Service] Initializing with:", {
  region,
  hasAccessKey: !!accessKeyId,
  hasSecretKey: !!secretAccessKey,
  fromEmail,
});

const sesClient = new SESClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function logEmail(
  direction: "incoming" | "outgoing",
  emailType: string,
  recipientEmail: string,
  senderEmail: string | null,
  subject: string | null,
  messageId: string | null,
  status: "sent" | "failed" = "sent",
  errorMessage: string | null = null,
  metadata: Record<string, any> | null = null
) {
  try {
    await pool.query(
      `insert into email_log (message_direction, email_type, recipient_email, sender_email, subject, message_id, status, error_message, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        direction,
        emailType,
        recipientEmail,
        senderEmail,
        subject,
        messageId,
        status,
        errorMessage,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error: any) {
    console.error("[Email Logging] Failed to log email:", error);
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string,
  userName: string,
) {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link will expire in 24 hours. If you didn't request a password reset, you can ignore this email.</p>
            <div class="warning">
              <strong>Security Note:</strong> Never share this link with anyone. LendIt staff will never ask for your password reset link.
            </div>
            <div class="footer">
              <p>If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 11px;">${resetLink}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Reset Your Password

Hi ${userName},

We received a request to reset your password. Click the link below to set a new password:

${resetLink}

This link will expire in 24 hours. If you didn't request a password reset, you can ignore this email.

Security Note: Never share this link with anyone. LendIt staff will never ask for your password reset link.

---
LendIt Support
  `;

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: "Reset Your LendIt Password",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`[Email] Password reset sent to ${toEmail}:`, response.MessageId);

    // Log successful email
    await logEmail(
      "outgoing",
      "password_reset",
      toEmail,
      fromEmail,
      "Reset Your LendIt Password",
      response.MessageId,
      "sent",
      null,
      { userName }
    );

    return { ok: true, messageId: response.MessageId };
  } catch (error: any) {
    console.error(`[Email] Failed to send password reset email to ${toEmail}:`, error);

    // Log failed email
    await logEmail(
      "outgoing",
      "password_reset",
      toEmail,
      fromEmail,
      "Reset Your LendIt Password",
      null,
      "failed",
      error?.Code || error?.message || "Unknown error",
      { userName, errorType: error?.constructor?.name }
    );

    throw error;
  }
}

export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
) {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LendIt!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your account has been created successfully. You're now ready to browse, rent, or share items on LendIt!</p>
            <p>Get started by exploring listings in your area or creating your first listing.</p>
            <div class="footer">
              <p>Questions? We're here to help. Reply to this email anytime.</p>
              <p>Happy renting!<br/>The LendIt Team</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `
Welcome to LendIt!

Hi ${userName},

Your account has been created successfully. You're now ready to browse, rent, or share items on LendIt!

Get started by exploring listings in your area or creating your first listing.

Questions? We're here to help. Reply to this email anytime.

Happy renting!
The LendIt Team
  `;

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: "Welcome to LendIt!",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`[Email] Welcome email sent to ${toEmail}:`, response.MessageId);
    return { ok: true, messageId: response.MessageId };
  } catch (error: any) {
    console.error(`[Email] Failed to send welcome email to ${toEmail}:`, error);
    throw error;
  }
}
