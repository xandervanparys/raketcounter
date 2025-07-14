'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from "next/navigation";


export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter();
  

  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        if (!error && data?.username) {
          setDisplayName(data.username)
        }
      }
    }
    fetchUsername()
  }, [])

  const updateDisplayName = async () => {
    setLoading(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ username: displayName })
        .eq('id', user.id)
      if (!error) {
        setMessage('Display name updated successfully!')
      } else {
        setMessage('Failed to update display name.')
      }
    }
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <a href="/" className="inline-block mb-4 text-blue-600 hover:underline">
        ← Home
      </a>
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
