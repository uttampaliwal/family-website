import { htmlEncode } from "./sanitization.js";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailContentOptions {
  recipientName?: string;
  companyName?: string;
  supportEmail?: string;
  brandColor?: string;
}

const DEFAULT_OPTIONS: Required<EmailContentOptions> = {
  recipientName: "User",
  companyName: "Family Website",
  supportEmail: "support@familywebsite.com",
  brandColor: "#2563eb",
};

/**
 * Creates a consistent email template with proper structure and styling
 */
function createEmailTemplate(
  title: string,
  content: string,
  options: EmailContentOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${htmlEncode(title)}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: ${opts.brandColor};
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #212529;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: ${opts.brandColor};
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
            text-align: center;
        }
        .security-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .code {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">${htmlEncode(opts.companyName)}</div>
        </div>
        <div class="title">${htmlEncode(title)}</div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:${htmlEncode(opts.supportEmail)}">${htmlEncode(opts.supportEmail)}</a></p>
            <p>This email was sent to you because you have an account with ${htmlEncode(opts.companyName)}.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Creates a plain text version of the email content
 */
function createTextVersion(
  title: string,
  content: string,
  options: EmailContentOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Strip HTML tags and convert to plain text
  const plainContent = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Convert non-breaking spaces
    .replace(/&amp;/g, "&") // Convert HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  return `
${opts.companyName}

${title}

${plainContent}

---

If you have any questions, please contact us at ${opts.supportEmail}

This email was sent to you because you have an account with ${opts.companyName}.
`.trim();
}

/**
 * Email verification template with clear purpose and instructions
 */
export function createEmailVerificationTemplate(
  verificationUrl: string,
  options: EmailContentOptions = {},
): EmailTemplate {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const title = "Verify Your Email Address";

  const content = `
    <p>Hello ${htmlEncode(opts.recipientName)},</p>
    
    <p><strong>Welcome to ${htmlEncode(opts.companyName)}!</strong> To complete your account setup and ensure the security of your account, please verify your email address.</p>
    
    <p><strong>What you need to do:</strong></p>
    <ol>
        <li>Click the verification button below</li>
        <li>You'll be redirected to our website</li>
        <li>Your email will be automatically verified</li>
    </ol>
    
    <div style="text-align: center;">
        <a href="${htmlEncode(verificationUrl)}" class="button">Verify Email Address</a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${htmlEncode(verificationUrl)}
    </p>
    
    <div class="security-notice">
        <strong>Security Notice:</strong> This verification link will expire in 24 hours for your security. 
        If you didn't create an account with us, please ignore this email.
    </div>
  `;

  return {
    subject: `Verify your email address - ${opts.companyName}`,
    html: createEmailTemplate(title, content, options),
    text: createTextVersion(title, content, options),
  };
}

/**
 * Password reset template with clear instructions and security information
 */
export function createPasswordResetTemplate(
  resetUrl: string,
  resetToken: string,
  options: EmailContentOptions = {},
): EmailTemplate {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const title = "Password Reset Request";

  const content = `
    <p>Hello ${htmlEncode(opts.recipientName)},</p>
    
    <p>We received a request to reset the password for your ${htmlEncode(opts.companyName)} account.</p>
    
    <p><strong>To reset your password:</strong></p>
    <ol>
        <li>Click the reset password button below</li>
        <li>Enter your reset code when prompted</li>
        <li>Create a new secure password</li>
    </ol>
    
    <div style="text-align: center;">
        <a href="${htmlEncode(resetUrl)}" class="button">Reset Password</a>
    </div>
    
    <p><strong>Your reset code:</strong></p>
    <div class="code">${htmlEncode(resetToken)}</div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${htmlEncode(resetUrl)}
    </p>
    
    <div class="security-notice">
        <strong>Security Information:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This reset code expires in 1 hour</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Your password will remain unchanged unless you complete the reset process</li>
            <li>For security, we recommend using a strong, unique password</li>
        </ul>
    </div>
  `;

  return {
    subject: `Password reset request - ${opts.companyName}`,
    html: createEmailTemplate(title, content, options),
    text: createTextVersion(title, content, options),
  };
}

/**
 * Password change confirmation template
 */
export function createPasswordChangeConfirmationTemplate(
  userEmail: string,
  options: EmailContentOptions = {},
): EmailTemplate {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const title = "Password Changed Successfully";

  const content = `
    <p>Hello ${htmlEncode(opts.recipientName)},</p>
    
    <p><strong>Your password has been successfully changed.</strong></p>
    
    <p>This email confirms that the password for your account (${htmlEncode(userEmail)}) was changed on ${new Date().toLocaleString()}.</p>
    
    <div class="security-notice">
        <strong>Security Alert:</strong> If you didn't make this change, please contact our support team immediately at 
        <a href="mailto:${htmlEncode(opts.supportEmail)}">${htmlEncode(opts.supportEmail)}</a>
    </div>
    
    <p><strong>Security Tips:</strong></p>
    <ul>
        <li>Keep your password secure and don't share it with anyone</li>
        <li>Use a unique password that you don't use for other accounts</li>
        <li>Consider enabling two-factor authentication for added security</li>
    </ul>
  `;

  return {
    subject: `Password changed - ${opts.companyName}`,
    html: createEmailTemplate(title, content, options),
    text: createTextVersion(title, content, options),
  };
}

/**
 * Document sharing notification template
 */
export function createDocumentShareTemplate(
  documentTitle: string,
  sharedByName: string,
  documentUrl: string,
  permission: string,
  message?: string,
  options: EmailContentOptions = {},
): EmailTemplate {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const title = "Document Shared With You";

  const content = `
    <p>Hello ${htmlEncode(opts.recipientName)},</p>
    
    <p><strong>${htmlEncode(sharedByName)}</strong> has shared a document with you on ${htmlEncode(opts.companyName)}.</p>
    
    <p><strong>Document Details:</strong></p>
    <ul>
        <li><strong>Title:</strong> ${htmlEncode(documentTitle)}</li>
        <li><strong>Permission Level:</strong> ${htmlEncode(permission === "read" ? "View Only" : "Edit Access")}</li>
        <li><strong>Shared by:</strong> ${htmlEncode(sharedByName)}</li>
    </ul>
    
    ${
      message
        ? `
    <p><strong>Personal Message:</strong></p>
    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${opts.brandColor}; margin: 15px 0;">
        ${htmlEncode(message)}
    </div>
    `
        : ""
    }
    
    <div style="text-align: center;">
        <a href="${htmlEncode(documentUrl)}" class="button">View Document</a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${htmlEncode(documentUrl)}
    </p>
  `;

  return {
    subject: `Document shared: ${documentTitle} - ${opts.companyName}`,
    html: createEmailTemplate(title, content, options),
    text: createTextVersion(title, content, options),
  };
}
