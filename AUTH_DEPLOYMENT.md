# Authentication & Email Reminders Deployment Guide

This guide covers deploying the enhanced productivity journal with email authentication and automated reminders.

## Overview of Changes

### What's New:
1. **Email Link Authentication** (passwordless magic links)
2. **Allowlist-based Access Control** (only approved emails can sign in)
3. **Weekday Morning Email Reminders** (Mon-Fri at 8 AM Central Time)
4. **Per-User Data Isolation** (each user sees only their own journals)
5. **Data Migration Tools** (export/import for anonymous users)
6. **User Settings** (toggle email reminders, manage data)

### Security Improvements:
- All unauthenticated users are redirected to login
- Firestore security rules enforce per-user data access
- Email allowlist prevents unauthorized access
- Cloud Functions validate user permissions

---

## Prerequisites

Before deploying, ensure you have:
- [ ] Firebase project created (from previous DEPLOYMENT.md)
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] SendGrid account (free tier works fine)
- [ ] Your Firebase config updated in `src/firebase.js`

---

## Part 1: SendGrid Setup (15 minutes)

### Step 1: Create Send Grid Account

1. Go to https://sendgrid.com/
2. Click "Start for Free"
3. Complete signup (free tier allows 100 emails/day)
4. Verify your email address

### Step 2: Create API Key

1. In SendGrid dashboard, go to Settings → API Keys
2. Click "Create API Key"
3. Name: `Productivity Journal`
4. Permissions: **Full Access**
5. Click "Create & View"
6. **COPY THE API KEY** - you'll need it for Firebase Functions
7. Keep this key secret!

### Step 3: Verify Sender Email

1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details:
   - From Name: `Productivity Journal`
   - From Email: `journal@beercountant.com` (or your preferred sender)
   - Reply To: (same as From Email)
4. Complete verification
5. Check your email and click the verification link

---

## Part 2: Firebase Setup (20 minutes)

### Step 1: Enable Email Link Authentication

1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Find "Email/Password" provider
4. Click to enable it
5. Toggle on **"Email link (passwordless sign-in)"**
6. Click "Save"
7. **DISABLE "Anonymous" provider** (we're replacing it with email auth)

### Step 2: Initialize Firebase in Your Project

Open terminal in your project folder:

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Functions (configure Cloud Functions)
# - Firestore (configure Firestore Database)
# - Hosting (configure hosting)

# When prompted:
# - Language: JavaScript
# - ESLint: No
# - Install dependencies: Yes
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No
```

### Step 3: Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 4: Configure Firebase Environment Variables

Set your SendGrid API key and other config:

```bash
# Set SendGrid API key
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"

# Set sender email
firebase functions:config:set sender.email="journal@beercountant.com"

# Set app URL
firebase functions:config:set app.url="https://journal.beercountant.com"
```

Replace placeholders:
- `YOUR_SENDGRID_API_KEY`: Your actual SendGrid API key from Part 1
- Email and URL: Use your actual domain

To view current config:
```bash
firebase functions:config:get
```

### Step 5: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This enforces:
- Only authenticated users can access data
- Users can only read/write their own data
- Allowlist is read-only for users, write-only for admins

### Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys:
- `beforeCreate`: Blocks sign-up if email not in allowlist
- `checkAllowlist`: Frontend can check if email is authorized
- `toggleEmailReminders`: Users can enable/disable reminders
- `sendWeekdayReminders`: Scheduled function (runs Mon-Fri 8 AM)
- `addToAllowlist`: Admin function to approve users
- `removeFromAllowlist`: Admin function to remove users
- `sendTestReminder`: Test email sending
- `unsubscribe`: HTTP endpoint for email unsubscribe links

**Note:** First deployment takes 5-10 minutes.

---

## Part 3: Allowlist Management (10 minutes)

### Step 1: Add Yourself as Admin

You need to manually set an admin claim for your own account first.

**After you sign in to the app for the first time**, run this in Firebase Console:

1. Go to Firebase Console → Authentication → Users
2. Copy your User UID
3. Go to Cloud Firestore → Start collection
4. Collection ID: `allowlist`
5. Document ID: your email address (e.g., `you@beercountant.com`)
6. Add fields:
   ```
   email: "you@beercountant.com"
   name: "Your Name"
   addedAt: [current timestamp]
   emailsEnabled: true
   ```
7. Add document

**Then, set admin custom claim via Firebase CLI:**

```bash
# Install Firebase Admin SDK helper (one-time)
npm install -g firebase-admin-cli

# Or use Node.js script:
node -e "
const admin = require('firebase-admin');
admin.initializeApp();
admin.auth().setCustomUserClaims('YOUR_USER_UID', { admin: true })
  .then(() => console.log('Admin claim set!'));
"
```

Replace `YOUR_USER_UID` with your actual UID from step 2.

### Step 2: Add Other Users to Allowlist

#### Option A: Via Cloud Function (Recommended)

Once you're an admin, you can use the app's admin panel (coming soon) or call the function directly:

```javascript
// In browser console while logged in as admin:
const addToAllowlist = firebase.functions().httpsCallable('addToAllowlist');
addToAllowlist({
  email: 'newuser@example.com',
  name: 'New User'
})
.then(result => console.log('Added:', result.data))
.catch(err => console.error(err));
```

#### Option B: Via Firestore Console

1. Go to Cloud Firestore
2. Select `allowlist` collection
3. Click "Add document"
4. Document ID: User's email
5. Add fields:
   ```
   email: "user@example.com"
   name: "User Name"
   addedAt: [current timestamp]
   emailsEnabled: true
   ```

### Step 3: Verify Allowlist Works

1. Try signing in with an email NOT in the allowlist
   - Should see: "This email is not authorized"
2. Add that email to allowlist
3. Try signing in again
   - Should receive magic link email
4. Click link to complete sign-in
   - Should successfully log in

---

## Part 4: Deploy Frontend (10 minutes)

### Step 1: Update Firebase Config

Make sure `src/firebase.js` has your actual Firebase config (not placeholders):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // Your actual values
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### Step 2: Build and Deploy

```bash
# Build the app
npm run build

# Deploy to Netlify (or Firebase Hosting)
# For Netlify: Follow original DEPLOYMENT.md Part 2

# For Firebase Hosting:
firebase deploy --only hosting
```

---

## Part 5: Configure Cloud Scheduler (Email Reminders)

The `sendWeekdayReminders` function needs to be triggered on a schedule.

### Step 1: Enable Cloud Scheduler

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your Firebase project
3. Navigate to "Cloud Scheduler"
4. Click "Enable API" if prompted

### Step 2: Create Schedule

Firebase automatically creates a Cloud Scheduler job for your scheduled function.

**Verify it's running:**

1. Go to Cloud Scheduler in Google Cloud Console
2. You should see a job named similar to: `firebase-schedule-sendWeekdayReminders-us-central1`
3. Schedule: `0 8 * * 1-5` (Mon-Fri at 8 AM Central)
4. Status: Enabled

**If not created automatically:**

```bash
# Deploy functions again to trigger scheduler creation
firebase deploy --only functions:sendWeekdayReminders
```

### Step 3: Test Email Reminders

**Send test email to yourself:**

1. Sign in to the app
2. Go to Settings
3. Click "Send Test Email"
4. Check your inbox

**Manual trigger of scheduled function:**

In Google Cloud Console → Cloud Scheduler:
1. Find your reminder job
2. Click "Run now"
3. Check logs in Functions → Logs

---

## Part 6: Testing & Verification

### Test Authentication

- [ ] Unauthenticated users see login screen
- [ ] Unauthorized emails see "not authorized" message
- [ ] Authorized emails receive magic link
- [ ] Magic link successfully signs in user
- [ ] Sign out works correctly

### Test Data Isolation

- [ ] Create journal entry as User A
- [ ] Sign out and sign in as User B
- [ ] User B should NOT see User A's journals
- [ ] User B creates own journal
- [ ] Sign back in as User A
- [ ] User A should still see only their own journals

### Test Email Reminders

- [ ] Enable email reminders in Settings
- [ ] Send test email - should receive it
- [ ] Disable email reminders
- [ ] User should not receive scheduled emails
- [ ] Re-enable reminders
- [ ] Wait for next scheduled run (or trigger manually)
- [ ] Should receive reminder email

### Test Allowlist

- [ ] Admin can add users via Cloud Function
- [ ] New users can sign in after being added
- [ ] Admin can remove users
- [ ] Removed users cannot sign in
- [ ] Non-admin users cannot manage allowlist

---

## Part 7: Migration from Anonymous Auth

### For Existing Anonymous Users

If you have users currently using anonymous auth, here's how they migrate:

#### Step 1: Export Anonymous Data

**Before deploying the new version:**

1. User visits app (still using anonymous auth)
2. Goes to Settings
3. Clicks "Export All Data"
4. Downloads JSON file with their journal data

#### Step 2: Deploy New Version

Deploy the authenticated version following steps above.

#### Step 3: Import Data to Authenticated Account

1. Add user's email to allowlist
2. User signs in with email link
3. Goes to Settings
4. Expands "Import Data" section
5. Pastes their exported JSON
6. Clicks "Import Data"
7. All their old journals are now in their authenticated account

**Automatic Migration (Advanced):**

If you want seamless migration, you can:
1. Before disabling anonymous auth, run a one-time migration script
2. Match anonymous UIDs to email addresses (requires user to claim their data)
3. Transfer all data from anonymous UID to email-authenticated UID

---

## Environment Variables Reference

### Required for Cloud Functions

Set via `firebase functions:config:set`:

```bash
# SendGrid Configuration
sendgrid.key           # Your SendGrid API key
sender.email           # Sender email address (must be verified in SendGrid)

# App Configuration
app.url               # Your app URL (e.g., https://journal.beercountant.com)
```

### Required for Frontend

In `src/firebase.js`:

```javascript
firebaseConfig = {
  apiKey,              # Firebase API key
  authDomain,          # Firebase auth domain
  projectId,           # Firebase project ID
  storageBucket,       # Firebase storage bucket
  messagingSenderId,   # Firebase messaging sender ID
  appId               # Firebase app ID
}
```

---

## Managing Users

### Add User to Allowlist

```bash
# Via Firestore console
1. Go to Firestore → allowlist collection
2. Add document with email as ID
3. Set fields: email, name, addedAt, emailsEnabled
```

### Remove User from Allowlist

```bash
# Via Firestore console
1. Go to Firestore → allowlist collection
2. Find document with user's email
3. Delete document
```

### Make User an Admin

```bash
# Via Firebase CLI
firebase auth:export users.json
# Edit JSON to add custom claims
firebase auth:import users.json --hash-algo=SCRYPT

# Or via Node.js:
node -e "
const admin = require('firebase-admin');
admin.initializeApp();
admin.auth().setCustomUserClaims('USER_UID', { admin: true })
  .then(() => console.log('Admin claim set!'));
"
```

---

## Troubleshooting

### "Email not authorized" even after adding to allowlist

- Check that email in allowlist matches exactly (case-sensitive)
- Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check Cloud Function logs for errors

### Magic link emails not sending

- Verify Firebase Email/Password provider is enabled with email link option
- Check Firebase Console → Authentication → Templates → Email link sign-in
- Verify you updated the action URL in templates

### Reminder emails not sending

- Check SendGrid API key is set: `firebase functions:config:get`
- Verify sender email is verified in SendGrid
- Check Cloud Scheduler is enabled and job exists
- Review Cloud Functions logs for errors
- Test with "Send Test Email" in Settings

### Users can't access their data after migration

- Verify Firestore security rules allow user's UID
- Check that data was imported with correct user ID
- Review browser console for permission errors

### Cloud Functions deployment fails

- Ensure you're on a paid plan (Blaze) for Firebase
- Cloud Functions require billing to be enabled
- Check that all dependencies are installed in functions/package.json
- Review deployment logs for specific errors

---

## Cost Estimate

### Free Tier Limits:
- **Firebase Auth**: Unlimited users (free)
- **Firestore**: 50K reads/day, 20K writes/day, 1GB storage (free)
- **Cloud Functions**: 2M invocations/month (free)
- **Cloud Scheduler**: 3 jobs (free)
- **SendGrid**: 100 emails/day (free)

### Expected Usage (1 user):
- Daily reminder: 1 email × 20 weekdays = 20 emails/month
- Auth operations: ~10/month
- Firestore reads/writes: ~200/month
- Cloud Function invocations: ~30/month

**Total monthly cost: $0** (well within free tiers)

### Paid Tier (if needed):
- Firebase Blaze: Pay-as-you-go
- SendGrid Essentials: $14.95/month (40K emails)
- Only needed if you have 100+ active users

---

## Security Best Practices

1. **Never commit secrets**
   - API keys stay in Firebase config (not in code)
   - Use environment variables for sensitive data

2. **Firestore Rules**
   - Already enforced: users can only access own data
   - Allowlist is read-only for non-admins
   - Never disable security rules in production

3. **Admin Access**
   - Only give admin claims to trusted users
   - Admins can manage allowlist and view logs
   - Audit admin actions regularly

4. **Email Security**
   - Magic links expire after use
   - Links are one-time use only
   - Users can disable email reminders anytime

5. **Data Privacy**
   - Each user's journals are private
   - No cross-user data access
   - Data export available for portability

---

## Next Steps

After successful deployment:

1. **Test Everything**: Follow Part 6 testing checklist
2. **Add Users**: Add emails to allowlist
3. **Monitor**: Check Cloud Functions logs regularly
4. **Backup**: Firestore auto-backups, but consider manual exports
5. **Scale**: If user base grows, review costs and quotas

## Support

If you encounter issues:

1. Check Firebase Console → Functions → Logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Review Firestore security rules
5. Test with a fresh browser/incognito mode

---

**Deployment complete!** Your productivity journal now has:
- ✅ Secure email authentication
- ✅ Authorized-users-only access
- ✅ Per-user data isolation
- ✅ Automated weekday email reminders
- ✅ User settings and preferences
- ✅ Data migration support

Enjoy your enhanced productivity journal!
