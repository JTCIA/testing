import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

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

// Authentication helper - automatically signs in the user anonymously
export const initAuth = (onUserReady) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      onUserReady(user.uid)
    } else {
      // No user, sign in anonymously
      signInAnonymously(auth).then(() => {
        // Will trigger onAuthStateChanged again
      }).catch((error) => {
        console.error('Error signing in:', error)
      })
    }
  })
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
