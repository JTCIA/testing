import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import sgMail from '@sendgrid/mail';

// Define configuration parameters
const SENDGRID_API_KEY = defineString('SENDGRID_KEY');
const SENDER_EMAIL = defineString('SENDER_EMAIL', { default: 'journal@beercountant.com' });
const APP_URL = defineString('APP_URL', { default: 'https://journal.beercountant.com' });

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

/**
 * Blocking function that runs before a user is created via email link
 * Checks if the email is in the allowlist
 */
export const beforeCreate = beforeUserCreated(async (event) => {
  const email = event.data.email?.toLowerCase();

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  // Check if email is in allowlist
  const allowlistDoc = await db.collection('allowlist').doc(email).get();

  if (!allowlistDoc.exists) {
    throw new HttpsError(
      'permission-denied',
      'This email is not authorized to access the journal. Please contact the administrator.'
    );
  }

  // Allow the user creation to proceed
  return;
});

/**
 * Callable function to check if an email is in the allowlist
 * Used by the frontend before attempting sign-in
 */
export const checkAllowlist = onCall(async (request) => {
  const email = request.data.email?.toLowerCase();

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  const allowlistDoc = await db.collection('allowlist').doc(email).get();

  return {
    allowed: allowlistDoc.exists,
    message: allowlistDoc.exists
      ? 'Email is authorized'
      : 'This email is not authorized to access the journal'
  };
});

/**
 * Admin function to add an email to the allowlist
 * Should only be called by authenticated admin users
 */
export const addToAllowlist = onCall(async (request) => {
  // Check if caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if caller is admin (you'll need to set this custom claim manually)
  if (!request.auth.token.admin) {
    throw new HttpsError('permission-denied', 'Only admins can manage the allowlist');
  }

  const email = request.data.email?.toLowerCase();
  const name = request.data.name || '';

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  // Add to allowlist
  await db.collection('allowlist').doc(email).set({
    email,
    name,
    addedAt: new Date().toISOString(),
    addedBy: request.auth.uid,
    emailsEnabled: true // Default to enabled
  });

  return { success: true, email };
});

/**
 * Admin function to remove an email from the allowlist
 */
export const removeFromAllowlist = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!request.auth.token.admin) {
    throw new HttpsError('permission-denied', 'Only admins can manage the allowlist');
  }

  const email = request.data.email?.toLowerCase();

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  await db.collection('allowlist').doc(email).delete();

  return { success: true, email };
});

/**
 * Function to toggle email reminders for a user
 */
export const toggleEmailReminders = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const email = request.auth.token.email?.toLowerCase();
  const enabled = request.data.enabled;

  if (typeof enabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'enabled must be a boolean');
  }

  // Update user settings
  await db.collection('users').doc(request.auth.uid).set({
    emailRemindersEnabled: enabled,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Also update allowlist doc if it exists
  const allowlistDoc = await db.collection('allowlist').doc(email).get();
  if (allowlistDoc.exists) {
    await db.collection('allowlist').doc(email).update({
      emailsEnabled: enabled
    });
  }

  return { success: true, enabled };
});

/**
 * Send email reminder to a user
 */
async function sendReminderEmail(email, name) {
  const apiKey = SENDGRID_API_KEY.value();
  const senderEmail = SENDER_EMAIL.value();
  const appUrl = APP_URL.value();

  if (!apiKey) {
    console.error('SendGrid API key not configured');
    return false;
  }

  // Initialize SendGrid with the API key
  sgMail.setApiKey(apiKey);

  const msg = {
    to: email,
    from: {
      email: senderEmail,
      name: 'Productivity Journal'
    },
    subject: 'Daily Journal Reminder',
    text: `Hi ${name || 'there'}!\n\nThis is your daily reminder to fill out your productivity journal.\n\nClick here to open your journal: ${appUrl}\n\nHave a productive day!\n\n---\nTo unsubscribe from these reminders, visit: ${appUrl}/settings`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Daily Journal Reminder</h2>
        <p>Hi ${name || 'there'}!</p>
        <p>This is your daily reminder to fill out your productivity journal.</p>
        <p style="margin: 30px 0;">
          <a href="${appUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Open Your Journal
          </a>
        </p>
        <p>Have a productive day!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="font-size: 12px; color: #6B7280;">
          To unsubscribe from these reminders, visit your <a href="${appUrl}/settings" style="color: #4F46E5;">settings</a>.
        </p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Reminder email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    return false;
  }
}

/**
 * Scheduled function to send weekday morning reminders
 * Runs Mon-Fri at 8:00 AM America/Chicago
 * Cloud Scheduler cron: "0 8 * * 1-5"
 */
export const sendWeekdayReminders = onSchedule({
  schedule: '0 8 * * 1-5', // Mon-Fri at 8 AM
  timeZone: 'America/Chicago',
  memory: '256MiB',
  timeoutSeconds: 540
}, async (event) => {
  console.log('Starting weekday reminder job...');

  // Get all users with email reminders enabled
  const allowlistSnapshot = await db.collection('allowlist')
    .where('emailsEnabled', '==', true)
    .get();

  if (allowlistSnapshot.empty) {
    console.log('No users with email reminders enabled');
    return;
  }

  const results = {
    sent: 0,
    failed: 0,
    skipped: 0
  };

  // Send emails (with rate limiting to avoid SendGrid limits)
  for (const doc of allowlistSnapshot.docs) {
    const data = doc.data();
    const email = data.email;
    const name = data.name || '';

    // Double-check user preferences
    const userDoc = await db.collection('users').doc(doc.id).get();
    if (userDoc.exists && userDoc.data().emailRemindersEnabled === false) {
      console.log(`Skipping ${email} - user disabled reminders`);
      results.skipped++;
      continue;
    }

    const success = await sendReminderEmail(email, name);
    if (success) {
      results.sent++;

      // Log the reminder send
      await db.collection('emailLogs').add({
        email,
        type: 'reminder',
        sentAt: new Date().toISOString(),
        success: true
      });
    } else {
      results.failed++;

      await db.collection('emailLogs').add({
        email,
        type: 'reminder',
        sentAt: new Date().toISOString(),
        success: false
      });
    }

    // Rate limit: wait 100ms between emails to avoid hitting SendGrid limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Reminder job complete:`, results);
  return results;
});

/**
 * Callable function to send a test reminder email
 * Useful for testing email configuration
 */
export const sendTestReminder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const email = request.auth.token.email;
  const name = request.data.name || '';

  const success = await sendReminderEmail(email, name);

  if (!success) {
    throw new HttpsError('internal', 'Failed to send test email');
  }

  return { success: true, message: 'Test email sent' };
});

/**
 * HTTP function to handle unsubscribe requests from email links
 * Usage: https://your-function-url/unsubscribe?email=user@example.com&token=...
 */
export const unsubscribe = onRequest(async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const email = req.query.email?.toLowerCase();

  if (!email) {
    res.status(400).send('Email parameter is required');
    return;
  }

  try {
    // Update allowlist
    const allowlistDoc = await db.collection('allowlist').doc(email).get();
    if (allowlistDoc.exists) {
      await db.collection('allowlist').doc(email).update({
        emailsEnabled: false
      });
    }

    // Find user by email and update preferences
    const usersSnapshot = await auth.getUserByEmail(email);
    if (usersSnapshot) {
      await db.collection('users').doc(usersSnapshot.uid).set({
        emailRemindersEnabled: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    const appUrl = APP_URL.value();
    res.status(200).send(`
      <html>
        <head><title>Unsubscribed</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Unsubscribed Successfully</h1>
          <p>You have been unsubscribed from daily journal reminders for <strong>${email}</strong>.</p>
          <p>You can re-enable reminders anytime from your journal settings.</p>
          <p><a href="${appUrl}" style="color: #4F46E5;">Return to Journal</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).send('Error processing unsubscribe request');
  }
});
