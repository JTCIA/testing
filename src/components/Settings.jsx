import { useState, useEffect } from 'react'
import {
  toggleEmailReminders,
  sendTestReminder,
  signOut,
  getCurrentUser,
  exportAnonymousData,
  importAnonymousData
} from '../firebase'

export default function Settings({ onClose, userId }) {
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importData, setImportData] = useState('')

  const currentUser = getCurrentUser()
  const isAnonymous = currentUser?.isAnonymous

  useEffect(() => {
    // Load current preference from Firestore if needed
    // For now, default to true
    setEmailRemindersEnabled(true)
  }, [])

  const handleToggleReminders = async (enabled) => {
    setLoading(true)
    setError('')
    setMessage('')

    const result = await toggleEmailReminders(enabled)

    if (result.success) {
      setEmailRemindersEnabled(enabled)
      setMessage(
        enabled
          ? 'Email reminders enabled successfully!'
          : 'Email reminders disabled successfully!'
      )
    } else {
      setError(result.error || 'Failed to update email preferences')
    }

    setLoading(false)
  }

  const handleSendTestEmail = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const result = await sendTestReminder()

    if (result.success) {
      setMessage('Test email sent! Check your inbox.')
    } else {
      setError(result.error || 'Failed to send test email')
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      const result = await signOut()
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || 'Failed to sign out')
      }
    }
  }

  const handleExportData = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const result = await exportAnonymousData(userId)

    if (result.success) {
      // Create downloadable JSON file
      const dataStr = JSON.stringify(result.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage('Data exported successfully!')
    } else {
      setError(result.error || 'Failed to export data')
    }

    setLoading(false)
  }

  const handleImportData = async () => {
    if (!importData.trim()) {
      setError('Please paste your export data')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const parsedData = JSON.parse(importData)
      const result = await importAnonymousData(userId, parsedData)

      if (result.success) {
        setMessage('Data imported successfully! Refreshing...')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setError(result.error || 'Failed to import data')
      }
    } catch (err) {
      setError('Invalid JSON data. Please check your export file.')
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-900">Settings</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Account Information */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-3">Account</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Email:</strong> {currentUser?.email || 'Anonymous'}
          </p>
          <p>
            <strong>User ID:</strong>{' '}
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {userId}
            </code>
          </p>
          {isAnonymous && (
            <p className="text-yellow-700 bg-yellow-50 p-3 rounded-lg mt-3">
              ⚠️ You are using an anonymous account. Your data is only
              accessible from this browser.
            </p>
          )}
        </div>
      </div>

      {/* Email Reminders - only for authenticated users */}
      {!isAnonymous && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">
            Email Reminders
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Receive a daily reminder email Monday–Friday at 8:00 AM (Central
            Time)
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Daily Reminders
            </span>
            <button
              onClick={() => handleToggleReminders(!emailRemindersEnabled)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                emailRemindersEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  emailRemindersEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleSendTestEmail}
            disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
          >
            Send Test Email
          </button>
        </div>
      )}

      {/* Data Export/Import */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-3">Data Management</h3>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
          >
            Export All Data
          </button>

          {isAnonymous && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-3">
                <strong>Migrating to authenticated account?</strong>
                <br />
                Export your data here, then sign in with email and import it.
              </p>
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium">
              Import Data
            </summary>
            <div className="mt-3 space-y-3">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your exported JSON data here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-32 font-mono text-xs"
              />
              <button
                onClick={handleImportData}
                disabled={loading || !importData.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50"
              >
                Import Data
              </button>
            </div>
          </details>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Sign Out */}
      <div className="pt-6">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
