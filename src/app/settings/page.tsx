'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'


export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  

  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()
        if (!error && data) {
          setDisplayName(data.username)
          setAvatarUrl(data.avatar_url ?? null)
        }
      }
    }
    fetchUsername()
  }, [])

  // Extract avatar upload logic to a separate function
  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`public/${userId}`, avatarFile, { upsert: true })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return null
    }

    return supabase.storage.from('avatars').getPublicUrl(`public/${userId}`).data.publicUrl
  }

  // Simplified and renamed updateProfile function
  const updateProfile = async () => {
    setLoading(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const avatarUrl = await uploadAvatar(user.id)
    const updates: { username: string, avatar_url?: string } = { username: displayName }
    if (avatarUrl) updates.avatar_url = avatarUrl

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    setMessage(error ? 'Failed to update profile.' : 'Profile updated successfully!')
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <Link href="/" className="inline-block mb-4 text-blue-600 hover:underline">
        ← Home
      </Link>
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

      <label className="block mb-2 font-semibold" htmlFor="avatar">
        Avatar Image
      </label>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Current avatar"
          className="w-24 h-24 object-cover rounded-lg mb-4"
        />
      )}
      <input
        id="avatar"
        type="file"
        accept="image/*"
        onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <button
        onClick={updateProfile}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>

      {message && <p className="mt-4">{message}</p>}
    </main>
  )
}
