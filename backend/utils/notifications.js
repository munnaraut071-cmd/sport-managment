const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Notification = require('../models/Notification');

/**
 * Multi-Channel Notification System
 * Supports Email, SMS (Twilio), and WhatsApp
 */

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Twilio client setup
const createTwilioClient = () => {
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    return twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  }
  return null;
};

/**
 * Send email notification
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SPORTKITS <noreply@sportkits.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      channel: 'email'
    };
    
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message,
      channel: 'email'
    };
  }
};

/**
 * Send SMS notification
 */
const sendSMS = async (to, message) => {
  try {
    const client = createTwilioClient();
    if (!client) {
      return {
        success: false,
        error: 'Twilio not configured',
        channel: 'sms'
      };
    }
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to.startsWith('+') ? to : `+91${to}` // Add India country code if missing
    });
    
    return {
      success: true,
      messageId: result.sid,
      channel: 'sms'
    };
    
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message,
      channel: 'sms'
    };
  }
};

/**
 * Send WhatsApp notification
 */
const sendWhatsApp = async (to, message) => {
  try {
    const client = createTwilioClient();
    if (!client) {
      return {
        success: false,
        error: 'Twilio not configured',
        channel: 'whatsapp'
      };
    }
    
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP || process.env.TWILIO_PHONE}`,
      to: `whatsapp:+91${to.replace(/^\+91/, '')}`
    });
    
    return {
      success: true,
      messageId: result.sid,
      channel: 'whatsapp'
    };
    
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: error.message,
      channel: 'whatsapp'
    };
  }
};

/**
 * Send multi-channel notification
 */
const sendNotification = async (user, notification) => {
  const results = {
    email: null,
    sms: null,
    whatsapp: null,
    inApp: null
  };
  
  // Save in-app notification
  try {
    const inAppNotif = await Notification.create({
      user: user._id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      relatedTo: notification.relatedTo || null
    });
    
    results.inApp = {
      success: true,
      notificationId: inAppNotif._id,
      channel: 'inApp'
    };
  } catch (error) {
    results.inApp = {
      success: false,
      error: error.message,
      channel: 'inApp'
    };
  }
  
  // Send email if enabled and email exists
  if (notification.channels?.includes('email') && user.email) {
    const html = generateEmailTemplate(notification);
    results.email = await sendEmail(user.email, notification.title, html);
  }
  
  // Send SMS if enabled and phone exists
  if (notification.channels?.includes('sms') && user.phone) {
    results.sms = await sendSMS(user.phone, notification.message);
  }
  
  // Send WhatsApp if enabled and phone exists
  if (notification.channels?.includes('whatsapp') && user.phone) {
    results.whatsapp = await sendWhatsApp(user.phone, notification.message);
  }
  
  return results;
};

/**
 * Send due date reminder
 */
const sendDueDateReminder = async (user, transaction, daysUntilDue) => {
  const kitName = transaction.kit?.name || 'Kit';
  
  let urgency, message, title;
  
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    urgency = 'urgent';
    title = '🚨 OVERDUE: Kit Return Required';
    message = `Your ${kitName} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please return immediately to avoid additional fines.`;
  } else if (daysUntilDue === 0) {
    urgency = 'high';
    title = '⚠️ Due Today: Kit Return';
    message = `Your ${kitName} is due today. Please return it by end of day.`;
  } else if (daysUntilDue === 1) {
    urgency = 'medium';
    title = '📅 Reminder: Kit Due Tomorrow';
    message = `Your ${kitName} is due tomorrow. Please plan to return it.`;
  } else {
    urgency = 'low';
    title = '🔔 Upcoming Due Date';
    message = `Your ${kitName} is due in ${daysUntilDue} days.`;
  }
  
  const notification = {
    type: daysUntilDue < 0 ? 'alert' : 'reminder',
    title,
    message,
    channels: ['inApp', 'email'], // Always send in-app and email
    relatedTo: {
      model: 'Transaction',
      id: transaction._id
    }
  };
  
  // Add SMS/WhatsApp for urgent reminders
  if (urgency === 'urgent' || urgency === 'high') {
    notification.channels.push('sms');
    if (user.preferences?.whatsappNotifications) {
      notification.channels.push('whatsapp');
    }
  }
  
  return await sendNotification(user, notification);
};

/**
 * Send fine notification
 */
const sendFineNotification = async (user, fine) => {
  const notification = {
    type: 'alert',
    title: '💰 Fine Imposed: Late Kit Return',
    message: `A fine of ₹${fine.fineAmount} has been imposed for late return of ${fine.kit?.name || 'kit'}. Days late: ${fine.daysLate}. Please pay to clear your record.`,
    channels: ['inApp', 'email', 'sms'],
    relatedTo: {
      model: 'Fine',
      id: fine._id
    }
  };
  
  return await sendNotification(user, notification);
};

/**
 * Send tournament notification
 */
const sendTournamentNotification = async (user, tournament, type = 'reminder') => {
  let title, message;
  
  switch (type) {
    case 'upcoming':
      title = '🏆 Tournament Coming Up';
      message = `${tournament.eventName} starts on ${new Date(tournament.startDate).toDateString()}. Reserved kits are ready for allocation.`;
      break;
    case 'allocation':
      title = '✅ Kit Allocated for Tournament';
      message = `You have been allocated a kit for ${tournament.eventName}. Collect it before the event.`;
      break;
    case 'reminder':
      title = '📅 Tournament Reminder';
      message = `Don't forget! ${tournament.eventName} is happening soon. Ensure your kit is ready.`;
      break;
  }
  
  const notification = {
    type: 'info',
    title,
    message,
    channels: ['inApp', 'email'],
    relatedTo: {
      model: 'Tournament',
      id: tournament._id
    }
  };
  
  return await sendNotification(user, notification);
};

/**
 * Send welcome notification
 */
const sendWelcomeNotification = async (user) => {
  const notification = {
    type: 'success',
    title: '👋 Welcome to SPORTKITS!',
    message: `Hi ${user.name}, welcome to the Sports Kit Management System. You can now browse and issue sports equipment. Browse available kits in the Kits section.`,
    channels: ['inApp', 'email']
  };
  
  return await sendNotification(user, notification);
};

/**
 * Generate HTML email template
 */
const generateEmailTemplate = (notification) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0F172A; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #22C55E; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SPORTKITS</h1>
        </div>
        <div class="content">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="button">${notification.actionText || 'View Details'}</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated message from SPORTKITS.</p>
          <p>© 2026 SPORTKITS - Sports Inventory Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendNotification,
  sendDueDateReminder,
  sendFineNotification,
  sendTournamentNotification,
  sendWelcomeNotification,
  generateEmailTemplate
};
