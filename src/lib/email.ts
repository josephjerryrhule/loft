import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { getCurrencySymbol } from "./utils";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderEmail: string;
  platformName: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: {
        in: ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "senderEmail", "platformName"],
      },
    },
  });

  const config: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => {
    // Parse JSON-stringified values
    try {
      config[s.key] = JSON.parse(s.value);
    } catch {
      // If not JSON, use as-is
      config[s.key] = s.value;
    }
  });

  if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPass) {
    console.warn("SMTP not fully configured");
    return null;
  }

  return {
    host: config.smtpHost,
    port: parseInt(config.smtpPort, 10),
    user: config.smtpUser,
    pass: config.smtpPass,
    senderEmail: config.senderEmail || config.smtpUser,
    platformName: config.platformName || "Loft",
  };
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      console.error("SMTP not configured, email not sent");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: `"${config.platformName}" <${config.senderEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Helper to get platform branding
async function getBranding() {
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: { in: ["platformName", "logoUrl", "supportEmail", "siteUrl"] },
    },
  });
  const config: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => {
    // Parse JSON-stringified values
    try {
      config[s.key] = JSON.parse(s.value);
    } catch {
      // If not JSON, use as-is
      config[s.key] = s.value;
    }
  });
  return {
    platformName: config.platformName || "Loft",
    logoUrl: config.logoUrl || "",
    supportEmail: config.supportEmail || "",
    siteUrl: config.siteUrl || process.env.NEXTAUTH_URL || "http://localhost:3000",
    currency: getCurrencySymbol(config.currency || "GHS"),
  };
}

// Base email template wrapper
function emailWrapper(content: string, platformName: string, logoUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${platformName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #1a1a1a; padding: 24px; text-align: center; }
    .header img { max-height: 50px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .footer { background: #f5f5f5; padding: 24px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background: #1a1a1a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .info-box { background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .amount { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) 
        ? `<img src="${logoUrl}" alt="${platformName}" style="max-height: 50px; height: auto;" />` 
        : `<h1>${platformName}</h1>`
      }
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

// 1. User Registration
export async function sendWelcomeEmail(user: {
  email: string;
  firstName: string;
  role: string;
}) {
  const branding = await getBranding();
  const content = `
    <h2>Welcome to ${branding.platformName}! 🎉</h2>
    <p>Hi ${user.firstName},</p>
    <p>Thank you for joining ${branding.platformName}. Your account has been created successfully.</p>
    <div class="info-box">
      <p><strong>Account Type:</strong> ${user.role}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    </div>
    <p>You can now log in to your account and start exploring.</p>
    <a href="${branding.siteUrl}/auth/login" class="button">Log In to Your Account</a>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Welcome to ${branding.platformName}!`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 2. Order Purchase - Customer Receipt
export async function sendOrderReceiptEmail(order: {
  id: string;
  customerEmail: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod?: string;
}) {
  const branding = await getBranding();
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${branding.currency}${item.price.toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2>Order Confirmation</h2>
    <p>Hi ${order.customerName},</p>
    <p>Thank you for your order! Here are your order details:</p>
    <div class="info-box">
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr style="font-weight: bold;">
          <td colspan="2">Total</td>
          <td style="text-align: right;">${branding.currency}${order.total.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <p>If you have any questions about your order, please don't hesitate to contact us.</p>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmation - ${order.id}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 2b. Order Purchase - Support Notification
export async function sendOrderNotificationToSupport(order: {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
}) {
  const branding = await getBranding();
  if (!branding.supportEmail) return false;

  const content = `
    <h2>New Order Received</h2>
    <p>A new order has been placed on ${branding.platformName}.</p>
    <div class="info-box">
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Email:</strong> ${order.customerEmail}</p>
      <p><strong>Total:</strong> ${branding.currency}${order.total.toLocaleString()}</p>
      <p><strong>Items:</strong> ${order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</p>
    </div>
    <a href="${branding.siteUrl}/admin/orders" class="button">View Order</a>
  `;

  return sendEmail({
    to: branding.supportEmail,
    subject: `New Order - ${order.id}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 3. User Subscription
export async function sendSubscriptionConfirmationEmail(subscription: {
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}) {
  const branding = await getBranding();
  const content = `
    <h2>Subscription Confirmed! 🎉</h2>
    <p>Hi ${subscription.userName},</p>
    <p>Your subscription has been activated successfully.</p>
    <div class="info-box">
      <p><strong>Plan:</strong> ${subscription.planName}</p>
      <p><strong>Amount:</strong> ${branding.currency}${subscription.amount.toLocaleString()}</p>
      <p><strong>Start Date:</strong> ${subscription.startDate.toLocaleDateString()}</p>
      <p><strong>End Date:</strong> ${subscription.endDate.toLocaleDateString()}</p>
    </div>
    <p>Enjoy your subscription benefits!</p>
    <a href="${branding.siteUrl}/customer/plans" class="button">View My Subscription</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: subscription.userEmail,
    subject: `Subscription Confirmed - ${subscription.planName}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 4. Affiliate Joined - Manager Notification
export async function sendAffiliateJoinedManagerEmail(data: {
  managerEmail: string;
  managerName: string;
  affiliateName: string;
  affiliateEmail: string;
}) {
  const branding = await getBranding();
  const content = `
    <h2>New Affiliate Joined Your Team! 🎉</h2>
    <p>Hi ${data.managerName},</p>
    <p>Great news! A new affiliate has joined your team.</p>
    <div class="info-box">
      <p><strong>Affiliate Name:</strong> ${data.affiliateName}</p>
      <p><strong>Email:</strong> ${data.affiliateEmail}</p>
    </div>
    <p>You'll earn commissions on all sales they generate.</p>
    <a href="${branding.siteUrl}/manager/team" class="button">View Your Team</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.managerEmail,
    subject: `New Affiliate Joined - ${data.affiliateName}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 4b. Affiliate Joined - Affiliate Welcome
export async function sendAffiliateWelcomeEmail(data: {
  affiliateEmail: string;
  affiliateName: string;
  managerName?: string;
}) {
  const branding = await getBranding();
  const content = `
    <h2>Welcome to the Affiliate Program! 🎉</h2>
    <p>Hi ${data.affiliateName},</p>
    <p>Congratulations on joining the ${branding.platformName} affiliate program!</p>
    ${data.managerName ? `<p>You've been added to <strong>${data.managerName}'s</strong> team.</p>` : ""}
    <div class="info-box">
      <p><strong>What's next?</strong></p>
      <ul>
        <li>Get your unique referral link from your dashboard</li>
        <li>Share products with your network</li>
        <li>Earn commissions on every sale</li>
      </ul>
    </div>
    <a href="${branding.siteUrl}/affiliate" class="button">Go to Dashboard</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.affiliateEmail,
    subject: `Welcome to ${branding.platformName} Affiliates!`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 5. Commission Earned
export async function sendCommissionEarnedEmail(data: {
  recipientEmail: string;
  recipientName: string;
  amount: number;
  orderId?: string;
  subscriptionId?: string;
  type: "AFFILIATE" | "MANAGER";
}) {
  const branding = await getBranding();
  const source = data.orderId ? `Order #${data.orderId}` : `Subscription #${data.subscriptionId}`;
  const content = `
    <h2>You Earned a Commission! 💰</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Great news! You've earned a ${data.type.toLowerCase()} commission.</p>
    <div class="info-box" style="text-align: center;">
      <p class="amount">${branding.currency}${data.amount.toLocaleString()}</p>
      <p>Commission from ${source}</p>
    </div>
    <p>This amount has been added to your pending balance.</p>
    <a href="${branding.siteUrl}/${data.type === "MANAGER" ? "manager" : "affiliate"}/commissions" class="button">View Commissions</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.recipientEmail,
    subject: `Commission Earned - ${branding.currency}${data.amount.toLocaleString()}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 6. Payout Request - Support Notification
export async function sendPayoutRequestToSupport(data: {
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  payoutId: string;
}) {
  const branding = await getBranding();
  if (!branding.supportEmail) return false;

  const content = `
    <h2>New Payout Request</h2>
    <p>A payout request has been submitted and requires approval.</p>
    <div class="info-box">
      <p><strong>User:</strong> ${data.userName}</p>
      <p><strong>Email:</strong> ${data.userEmail}</p>
      <p><strong>Amount:</strong> ${branding.currency}${data.amount.toLocaleString()}</p>
      <p><strong>Bank:</strong> ${data.bankName}</p>
      <p><strong>Account:</strong> ${data.accountNumber}</p>
    </div>
    <a href="${branding.siteUrl}/admin/finance" class="button">Review Payout</a>
  `;

  return sendEmail({
    to: branding.supportEmail,
    subject: `Payout Request - ${branding.currency}${data.amount.toLocaleString()}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 7. Payout Approval
export async function sendPayoutApprovalEmail(data: {
  userEmail: string;
  userName: string;
  amount: number;
  status: "APPROVED" | "REJECTED";
  reason?: string;
}) {
  const branding = await getBranding();
  const isApproved = data.status === "APPROVED";
  const content = `
    <h2>Payout ${isApproved ? "Approved" : "Update"}</h2>
    <p>Hi ${data.userName},</p>
    <p>Your payout request has been <strong>${isApproved ? "approved" : "rejected"}</strong>.</p>
    <div class="info-box" style="text-align: center;">
      <p class="amount">${branding.currency}${data.amount.toLocaleString()}</p>
      <span class="status-badge ${isApproved ? "status-completed" : "status-pending"}">${data.status}</span>
    </div>
    ${isApproved ? "<p>The funds will be transferred to your bank account shortly.</p>" : ""}
    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
    <a href="${branding.siteUrl}/settings" class="button">View Account</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Payout ${data.status} - ${branding.currency}${data.amount.toLocaleString()}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 8. Subscription Receipt
export async function sendSubscriptionReceiptEmail(subscription: {
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  transactionId: string;
  billingPeriod: string;
}) {
  const branding = await getBranding();
  const content = `
    <h2>Subscription Receipt</h2>
    <p>Hi ${subscription.userName},</p>
    <p>Thank you for your subscription payment. Here's your receipt:</p>
    <div class="info-box">
      <table style="width: 100%;">
        <tr>
          <td><strong>Plan</strong></td>
          <td style="text-align: right;">${subscription.planName}</td>
        </tr>
        <tr>
          <td><strong>Billing Period</strong></td>
          <td style="text-align: right;">${subscription.billingPeriod}</td>
        </tr>
        <tr>
          <td><strong>Transaction ID</strong></td>
          <td style="text-align: right;">${subscription.transactionId}</td>
        </tr>
        <tr>
          <td><strong>Date</strong></td>
          <td style="text-align: right;">${new Date().toLocaleDateString()}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 1.2em;">
          <td><strong>Total</strong></td>
          <td style="text-align: right;">${branding.currency}${subscription.amount.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: subscription.userEmail,
    subject: `Subscription Receipt - ${subscription.planName}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 9. Plan Renewal Reminder
export async function sendPlanRenewalReminderEmail(subscription: {
  userEmail: string;
  userName: string;
  planName: string;
  expiryDate: Date;
  daysRemaining: number;
}) {
  const branding = await getBranding();
  const content = `
    <h2>Subscription Renewal Reminder</h2>
    <p>Hi ${subscription.userName},</p>
    <p>Your subscription is expiring soon!</p>
    <div class="info-box" style="text-align: center;">
      <p><strong>${subscription.planName}</strong></p>
      <p class="amount">${subscription.daysRemaining} days remaining</p>
      <p>Expires: ${subscription.expiryDate.toLocaleDateString()}</p>
    </div>
    <p>Renew now to continue enjoying all the benefits of your subscription.</p>
    <a href="${branding.siteUrl}/customer/plans" class="button">Renew Subscription</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: subscription.userEmail,
    subject: `Subscription Expiring in ${subscription.daysRemaining} Days`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 10. User Account Status Change
export async function sendAccountStatusChangeEmail(data: {
  userEmail: string;
  userName: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
}) {
  const branding = await getBranding();
  const statusMessages: Record<string, string> = {
    ACTIVE: "Your account has been activated.",
    SUSPENDED: "Your account has been suspended.",
    BANNED: "Your account has been banned.",
    PENDING: "Your account is pending approval.",
  };

  const content = `
    <h2>Account Status Updated</h2>
    <p>Hi ${data.userName},</p>
    <p>${statusMessages[data.newStatus] || `Your account status has been changed to ${data.newStatus}.`}</p>
    <div class="info-box">
      <p><strong>Previous Status:</strong> ${data.oldStatus}</p>
      <p><strong>New Status:</strong> ${data.newStatus}</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
    </div>
    ${data.newStatus === "ACTIVE" ? `<a href="${branding.siteUrl}/auth/login" class="button">Log In</a>` : ""}
    <p>If you have any questions, please contact support.</p>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Account Status: ${data.newStatus}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 11. Order Status Change
export async function sendOrderStatusChangeEmail(order: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  oldStatus: string;
  newStatus: string;
}) {
  const branding = await getBranding();
  const statusMessages: Record<string, string> = {
    PROCESSING: "Your order is now being processed.",
    SHIPPED: "Your order has been shipped!",
    DELIVERED: "Your order has been delivered.",
    COMPLETED: "Your order has been completed.",
    CANCELLED: "Your order has been cancelled.",
  };

  const content = `
    <h2>Order Status Updated</h2>
    <p>Hi ${order.customerName},</p>
    <p>${statusMessages[order.newStatus] || `Your order status has been updated to ${order.newStatus}.`}</p>
    <div class="info-box">
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>New Status:</strong> <span class="status-badge status-active">${order.newStatus}</span></p>
    </div>
    <a href="${branding.siteUrl}/customer" class="button">View Order</a>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderId} - ${order.newStatus}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// 12. Password Reset
export async function sendPasswordResetEmail(data: {
  userEmail: string;
  userName: string;
  resetToken: string;
}) {
  const branding = await getBranding();
  const resetUrl = `${branding.siteUrl}/auth/reset-password?token=${data.resetToken}`;
  
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${data.userName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p style="font-size: 12px; color: #666; margin-top: 24px;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="font-size: 12px; color: #666;">
      If the button doesn't work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}">${resetUrl}</a>
    </p>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Reset Your Password - ${branding.platformName}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}

// Email: Verify email address
export async function sendEmailVerification(data: { userEmail: string; verificationUrl: string }) {
  const branding = await getBranding();

  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi there,</p>
    <p>
      Thank you for registering with ${branding.platformName}! Please verify your email address 
      to complete your registration and access all features.
    </p>
    <p style="text-align: center;">
      <a href="${data.verificationUrl}" class="button" style="color: #ffffff;">Verify Email Address</a>
    </p>
    <p style="font-size: 14px; color: #666;">
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
    <p style="font-size: 12px; color: #666;">
      If the button doesn't work, copy and paste this URL into your browser:<br>
      <a href="${data.verificationUrl}">${data.verificationUrl}</a>
    </p>
    <p>Best regards,<br>The ${branding.platformName} Team</p>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Verify Your Email - ${branding.platformName}`,
    html: emailWrapper(content, branding.platformName, branding.logoUrl),
  });
}
