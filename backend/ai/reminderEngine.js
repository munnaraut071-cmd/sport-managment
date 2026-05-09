const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Smart Reminder Engine
 * Sends personalized reminders based on:
 * - User risk score (high risk = early reminders)
 * - Due date proximity
 * - Historical behavior patterns
 */

let reminderJobs = [];

/**
 * Initialize the reminder engine
 */
const initializeReminderEngine = (io) => {
  console.log('🔔 Initializing Smart Reminder Engine...');
  
  // Daily reminder check at 9 AM
  const dailyReminder = cron.schedule('0 9 * * *', async () => {
    console.log('Running daily reminder check...');
    await processReminders(io);
  });
  
  // Weekly overdue check on Mondays at 10 AM
  const weeklyOverdue = cron.schedule('0 10 * * 1', async () => {
    console.log('Running weekly overdue summary...');
    await processOverdueSummary(io);
  });
  
  reminderJobs.push(dailyReminder, weeklyOverdue);
  
  console.log('✅ Reminder Engine initialized');
};

/**
 * Process daily reminders
 */
const processReminders = async (io) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    // Get all active transactions
    const activeTransactions = await Transaction.find({
      status: { $in: ['active', 'overdue'] }
    }).populate('user', 'name email riskScore')
      .populate('kit', 'name category');
    
    for (const transaction of activeTransactions) {
      const dueDate = new Date(transaction.dueDate);
      const user = transaction.user;
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      // Determine if reminder should be sent based on user risk and due date
      const shouldRemind = shouldSendReminder(user, daysUntilDue, transaction.reminderSent);
      
      if (shouldRemind) {
        await sendReminder(io, transaction, daysUntilDue);
      }
    }
    
    console.log(`Processed reminders for ${activeTransactions.length} active transactions`);
    
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
};

/**
 * Determine if reminder should be sent
 */
const shouldSendReminder = (user, daysUntilDue, alreadyReminded) => {
  const riskScore = user.riskScore || 0;
  
  // High risk users: remind 2 days before and on due day
  if (riskScore >= 70) {
    return (daysUntilDue === 2 || daysUntilDue === 0) && !alreadyReminded;
  }
  
  // Medium risk users: remind 1 day before and on due day
  if (riskScore >= 40) {
    return (daysUntilDue === 1 || daysUntilDue === 0) && !alreadyReminded;
  }
  
  // Low risk users: remind only on due day
  return daysUntilDue === 0 && !alreadyReminded;
};

/**
 * Send reminder to user
 */
const sendReminder = async (io, transaction, daysUntilDue) => {
  try {
    const { user, kit, dueDate } = transaction;
    
    let title, message, urgency;
    
    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      title = 'Overdue Kit Return';
      message = `Your ${kit.name} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please return it immediately.`;
      urgency = 'high';
    } else if (daysUntilDue === 0) {
      title = 'Due Today';
      message = `Your ${kit.name} is due today. Please return it by end of day.`;
      urgency = 'high';
    } else {
      title = 'Return Reminder';
      message = `Your ${kit.name} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}. Please plan to return it.`;
      urgency = 'medium';
    }
    
    // Create notification record
    await Notification.create({
      user: user._id,
      type: daysUntilDue < 0 ? 'alert' : 'reminder',
      title,
      message,
      relatedTo: {
        model: 'Transaction',
        id: transaction._id
      }
    });
    
    // Mark transaction as reminded
    transaction.reminderSent = true;
    transaction.reminderDate = new Date();
    await transaction.save();
    
    // Emit real-time notification
    if (io) {
      io.to(`user_${user._id}`).emit('due_reminder', {
        transactionId: transaction._id,
        kitName: kit.name,
        dueDate,
        daysUntilDue,
        urgency
      });
      
      // Also notify admins for overdue items
      if (daysUntilDue < 0) {
        io.to('admin').emit('overdue_alert', {
          userId: user._id,
          userName: user.name,
          kitName: kit.name,
          daysOverdue: Math.abs(daysUntilDue),
          transactionId: transaction._id
        });
      }
    }
    
    console.log(`Reminder sent to ${user.name} for ${kit.name}`);
    
  } catch (error) {
    console.error('Error sending reminder:', error);
  }
};

/**
 * Process weekly overdue summary
 */
const processOverdueSummary = async (io) => {
  try {
    const overdueTransactions = await Transaction.find({
      status: 'overdue'
    }).populate('user', 'name email')
      .populate('kit', 'name category');
    
    if (overdueTransactions.length === 0) {
      console.log('No overdue items this week');
      return;
    }
    
    // Group by user
    const overdueByUser = {};
    overdueTransactions.forEach(t => {
      if (!overdueByUser[t.user._id]) {
        overdueByUser[t.user._id] = {
          user: t.user,
          items: []
        };
      }
      overdueByUser[t.user._id].items.push(t);
    });
    
    // Send summary to each user with overdue items
    for (const [userId, data] of Object.entries(overdueByUser)) {
      const { user, items } = data;
      
      // Create notification
      await Notification.create({
        user: userId,
        type: 'alert',
        title: 'Weekly Overdue Summary',
        message: `You have ${items.length} overdue item${items.length > 1 ? 's' : ''}. Please return them as soon as possible.`,
      });
      
      // Emit notification
      if (io) {
        io.to(`user_${userId}`).emit('notification', {
          title: 'Weekly Overdue Summary',
          message: `You have ${items.length} overdue item${items.length > 1 ? 's' : ''}`,
          type: 'alert'
        });
      }
    }
    
    // Notify admins with summary
    if (io) {
      io.to('admin').emit('weekly_overdue_summary', {
        totalOverdue: overdueTransactions.length,
        affectedUsers: Object.keys(overdueByUser).length,
        details: overdueTransactions.map(t => ({
          user: t.user.name,
          kit: t.kit.name,
          daysOverdue: t.daysOverdue
        }))
      });
    }
    
    console.log(`Weekly overdue summary sent: ${overdueTransactions.length} items, ${Object.keys(overdueByUser).length} users`);
    
  } catch (error) {
    console.error('Error processing overdue summary:', error);
  }
};

/**
 * Send immediate notification
 */
const sendImmediateNotification = async (io, userId, title, message, type = 'info') => {
  try {
    // Create notification record
    await Notification.create({
      user: userId,
      type,
      title,
      message
    });
    
    // Emit real-time notification
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        title,
        message,
        type
      });
    }
    
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
};

/**
 * Stop all reminder jobs
 */
const stopReminderEngine = () => {
  reminderJobs.forEach(job => job.stop());
  reminderJobs = [];
  console.log('Reminder Engine stopped');
};

module.exports = {
  initializeReminderEngine,
  processReminders,
  sendImmediateNotification,
  stopReminderEngine
};
