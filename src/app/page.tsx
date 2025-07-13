'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [count, setCount] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [router])

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return
      const { count, error } = await supabase
        .from('raket_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!error && typeof count === 'number') {
        setCount(count)
      }
    }

    fetchCount()
  }, [user])

  const prikEenRaket = async () => {
    if (!user) return
    await supabase.from('raket_logs').insert({
      user_id: user.id,
      amount: 1,
    })
    alert('🚀 Raket gelanceerd!')
    setCount((prev) => prev + 1)
  }

  const zetEenBak = async () => {
    if (!user) return
    await supabase.from('raket_logs').insert({
      user_id: user.id,
      amount: 24,
    })
    alert('🛸 Ufo gelanceerd!')
    setCount((prev) => prev + 24)
  }

  if (!user) return null

  return (
    <main className="p-8 text-center">
      <Navbar />
      <h1 className="text-3xl font-bold mb-4">Welkom bij de Raketcounter</h1>
      <p className="mb-2">Ingelogd als: {user.email}</p>
      <p className="mb-4">Aantal raketten gelanceerd: <strong>{count}</strong></p>
      <button
        onClick={prikEenRaket}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Lanceer een raket 🚀
      </button>

      <button
        onClick={zetEenBak}
        className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Zet een Bak 🛸
      </button>
    </main>
  )
}