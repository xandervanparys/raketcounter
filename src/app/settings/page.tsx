'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.user_metadata?.display_name) {
        setDisplayName(data.user.user_metadata.display_name)
      }
    })
  }, [])

  const updateDisplayName = async () => {
    setLoading(true)
    setMessage('')
    await supabase.auth.updateUser({
      data: { display_name: displayName }
    })
    setLoading(false)
    setMessage('Display name updated successfully!')
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

      <label className="block mb-2 font-semibold" htmlFor="displayName">
        Display Name
      </label>
      <input
        id="displayName"
        type="text"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="Enter your display name"
      />

      <button
        onClick={updateDisplayName}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>

      {message && <p className="mt-4">{message}</p>}
    </main>
  )
}
