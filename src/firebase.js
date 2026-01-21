import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  sendSignInLinkToEmail,
  isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

// Firebase configuration - YOU WILL NEED TO REPLACE THESE VALUES
// Instructions: After creating your Firebase project, you'll get these values from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA4LJBFIa-_QOMEETnFAApxF9vzeQlIVuY",
  authDomain: "productivity-journal-f189e.firebaseapp.com",
  projectId: "productivity-journal-f189e",
  storageBucket: "productivity-journal-f189e.firebasestorage.app",
  messagingSenderId: "933693749374",
  appId: "1:933693749374:web:00cd198d4332221418c02f"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)

// Email link action code settings
const actionCodeSettings = {
  url: window.location.origin + '/finishSignIn',
  handleCodeInApp: true
}

/**
 * Check if an email is in the allowlist before attempting sign-in
 */
export const checkAllowlist = async (email) => {
  const checkAllowlistFn = httpsCallable(functions, 'checkAllowlist')
  try {
    const result = await checkAllowlistFn({ email })
    return result.data
  } catch (error) {
    console.error('Error checking allowlist:', error)
    return { allowed: false, message: 'Error checking authorization' }
  }
}

/**
 * Send sign-in link to email
 */
export const sendSignInLink = async (email) => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings)
    // Save email to localStorage so we can verify it after redirect
    window.localStorage.setItem('emailForSignIn', email)
    return { success: true }
  } catch (error) {
    console.error('Error sending sign-in link:', error)
    return {
      success: false,
      error: error.message || 'Failed to send sign-in link'
    }
  }
}

/**
 * Check if URL is a sign-in link
 */
export const isSignInWithEmailLink = (url) => {
  return firebaseIsSignInWithEmailLink(auth, url)
}

/**
 * Complete sign-in with email link
 */
export const completeSignIn = async (emailLink) => {
  try {
    if (!firebaseIsSignInWithEmailLink(auth, emailLink)) {
      return {
        success: false,
        error: 'Invalid sign-in link'
      }
    }

    // Get the email if available
    let email = window.localStorage.getItem('emailForSignIn')

    if (!email) {
      // Prompt user to provide email if not found
      email = window.prompt('Please provide your email for confirmation')
    }

    if (!email) {
      return {
        success: false,
        error: 'Email is required to complete sign-in'
      }
    }

    // Sign in with email link
    const result = await signInWithEmailLink(auth, email, emailLink)

    // Clear email from localStorage
    window.localStorage.removeItem('emailForSignIn')

    return {
      success: true,
      user: result.user
    }
  } catch (error) {
    console.error('Error completing sign-in:', error)
    return {
      success: false,
      error: error.message || 'Failed to complete sign-in'
    }
  }
}

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return {
      success: false,
      error: error.message || 'Failed to sign out'
    }
  }
}

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser
}

/**
 * Authentication helper - monitors auth state changes
 * For migration: supports both anonymous and email auth
 */
export const initAuth = (onUserReady) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in (either email or anonymous)
      onUserReady(user)
    } else {
      // No user signed in
      onUserReady(null)
    }
  })
}

/**
 * LEGACY: Sign in anonymously (for migration period only)
 * This will be removed after all users migrate to email auth
 */
export const signInAnonymouslyLegacy = async () => {
  try {
    const result = await signInAnonymously(auth)
    return { success: true, user: result.user }
  } catch (error) {
    console.error('Error signing in anonymously:', error)
    return {
      success: false,
      error: error.message || 'Failed to sign in'
    }
  }
}

/**
 * Export anonymous data for migration
 * Returns all user data as JSON for download
 */
export const exportAnonymousData = async (userId) => {
  try {
    const [journals, projectTags, summaries] = await Promise.all([
      loadJournalsFromFirebase(userId),
      loadProjectTagsFromFirebase(userId),
      loadWeeklySummariesFromFirebase(userId)
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      anonymousUserId: userId,
      journals,
      projectTags,
      weeklySummaries: summaries
    }

    return {
      success: true,
      data: exportData
    }
  } catch (error) {
    console.error('Error exporting data:', error)
    return {
      success: false,
      error: error.message || 'Failed to export data'
    }
  }
}

/**
 * Import data from anonymous account
 * Allows authenticated user to claim their anonymous data
 */
export const importAnonymousData = async (currentUserId, importData) => {
  try {
    if (!importData || !importData.journals) {
      throw new Error('Invalid import data')
    }

    // Import journals
    if (importData.journals.length > 0) {
      await saveJournalsToFirebase(currentUserId, importData.journals)
    }

    // Import project tags
    if (importData.projectTags && importData.projectTags.length > 0) {
      await saveProjectTagsToFirebase(currentUserId, importData.projectTags)
    }

    // Import weekly summaries
    if (importData.weeklySummaries && importData.weeklySummaries.length > 0) {
      await saveWeeklySummariesToFirebase(currentUserId, importData.weeklySummaries)
    }

    return { success: true }
  } catch (error) {
    console.error('Error importing data:', error)
    return {
      success: false,
      error: error.message || 'Failed to import data'
    }
  }
}

// Save journals to Firestore
export const saveJournalsToFirebase = async (userId, journals) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'journals')
    await setDoc(docRef, { journals, updatedAt: new Date().toISOString() })
    return true
  } catch (error) {
    console.error('Error saving journals:', error)
    return false
  }
}

// Load journals from Firestore
export const loadJournalsFromFirebase = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'journals')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().journals || []
    }
    return []
  } catch (error) {
    console.error('Error loading journals:', error)
    return []
  }
}

// Save project tags to Firestore
export const saveProjectTagsToFirebase = async (userId, projectTags) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'projectTags')
    await setDoc(docRef, { projectTags, updatedAt: new Date().toISOString() })
    return true
  } catch (error) {
    console.error('Error saving project tags:', error)
    return false
  }
}

// Load project tags from Firestore
export const loadProjectTagsFromFirebase = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'projectTags')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().projectTags || []
    }
    return []
  } catch (error) {
    console.error('Error loading project tags:', error)
    return []
  }
}

// Save weekly summaries to Firestore
export const saveWeeklySummariesToFirebase = async (userId, summaries) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'weeklySummaries')
    await setDoc(docRef, { summaries, updatedAt: new Date().toISOString() })
    return true
  } catch (error) {
    console.error('Error saving weekly summaries:', error)
    return false
  }
}

// Load weekly summaries from Firestore
export const loadWeeklySummariesFromFirebase = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'weeklySummaries')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().summaries || []
    }
    return []
  } catch (error) {
    console.error('Error loading weekly summaries:', error)
    return []
  }
}

// Toggle email reminders for current user
export const toggleEmailReminders = async (enabled) => {
  const toggleFn = httpsCallable(functions, 'toggleEmailReminders')
  try {
    const result = await toggleFn({ enabled })
    return result.data
  } catch (error) {
    console.error('Error toggling email reminders:', error)
    return { success: false, error: error.message }
  }
}

// Send test reminder email
export const sendTestReminder = async () => {
  const testFn = httpsCallable(functions, 'sendTestReminder')
  try {
    const result = await testFn()
    return result.data
  } catch (error) {
    console.error('Error sending test reminder:', error)
    return { success: false, error: error.message }
  }
}
