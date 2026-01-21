import { useState, useEffect } from 'react'
import {
  checkAllowlist,
  sendSignInLink,
  completeSignIn,
  isSignInWithEmailLink
} from '../firebase'

export default function Login({ onSignInSuccess }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [checkingLink, setCheckingLink] = useState(true)

  // Check if this is a sign-in link redirect
  useEffect(() => {
    const handleSignInLink = async () => {
      const url = window.location.href

      if (isSignInWithEmailLink(url)) {
        setCheckingLink(true)
        const result = await completeSignIn(url)

        if (result.success) {
          setMessage('Successfully signed in!')
          // Clear the URL
          window.history.replaceState({}, document.title, window.location.pathname)
          if (onSignInSuccess) {
            onSignInSuccess(result.user)
          }
        } else {
          setError(result.error || 'Failed to complete sign-in')
          setCheckingLink(false)
        }
      } else {
        setCheckingLink(false)
      }
    }

    handleSignInLink()
  }, [onSignInSuccess])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // First check if email is in allowlist
      const allowlistCheck = await checkAllowlist(email)

      if (!allowlistCheck.allowed) {
        setError(
          allowlistCheck.message ||
          'This email is not authorized. Please contact the administrator.'
        )
        setLoading(false)
        return
      }

      // Send sign-in link
      const result = await sendSignInLink(email)

      if (result.success) {
        setMessage(
          `Sign-in link sent to ${email}! Check your inbox and click the link to sign in.`
        )
        setEmail('')
      } else {
        setError(result.error || 'Failed to send sign-in link')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error(err)
    }

    setLoading(false)
  }

  if (checkingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing sign-in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">
            Productivity Journal
          </h1>
          <p className="text-gray-600">Sign in to access your journal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send Sign-In Link'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">How it works:</p>
          <ol className="text-left space-y-1 text-xs">
            <li>1. Enter your email address</li>
            <li>2. Check your inbox for a sign-in link</li>
            <li>3. Click the link to access your journal</li>
            <li>4. No password needed!</li>
          </ol>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>
            Only authorized emails can access this journal.
            <br />
            Contact the administrator for access.
          </p>
        </div>
      </div>
    </div>
  )
}
