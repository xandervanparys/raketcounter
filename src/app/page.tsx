'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const prikEenRaket = async () => {
    if (!user) return
    await supabase.from('raket_logs').insert({
      user_id: user.id,
      amount: 1,
    })
    alert('🚀 Raket gelanceerd!')
  }

  if (!user) return null

  return (
    <main className="p-8 text-center">
      <Navbar />
      <h1 className="text-3xl font-bold mb-4">Welkom bij de Raketcounter</h1>
      <p className="mb-4">Ingelogd als: {user.email}</p>
      <button
        onClick={prikEenRaket}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Lanceer een raket 🚀
      </button>
    </main>
  )
}