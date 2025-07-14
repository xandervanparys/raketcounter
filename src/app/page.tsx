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
  const [customAmount, setCustomAmount] = useState<number>(1)

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
        .eq('profile_id', user.id)

      if (!error && typeof count === 'number') {
        setCount(count)
      }
    }

    fetchCount()
  }, [user])

  const prikEenRaket = async () => {
    if (!user) return
    await supabase.from('raket_logs').insert({
      profile_id: user.id,
      amount: 1,
    })
    alert('🚀 Raket gelanceerd!')
    setCount((prev) => prev + 1)
  }

  const zetEenBak = async () => {
    if (!user) return
    await supabase.from('raket_logs').insert({
      profile_id: user.id,
      amount: 24,
    })
    alert('🛸 Ufo gelanceerd!')
    setCount((prev) => prev + 24)
  }

  const customAantalPils = async () => {
  if (!user) return
  if (customAmount <= 0) {
    alert('Geen negatieve pinten fucking ND.')
    return
  }

  await supabase.from('raket_logs').insert({
    profile_id: user.id,
    amount: customAmount,
  })
  alert(`✅ ${customAmount} raket(ten) gelanceerd!`)
  setCount((prev) => prev + customAmount)
  setCustomAmount(1) // Reset input
}


  if (!user) return null

  return (
    <main className="p-8 text-center">
      <Navbar />
      <h1 className="text-3xl font-bold mb-4">Welkom bij de Raketcounter</h1>
      <p className="mb-2">Ingelogd als: {user.email}</p>
      <p className="mb-4">Aantal raketten gelanceerd: <strong>{count}</strong></p>
      <div className="flex flex-col items-center gap-4">
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
        <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={customAmount}
          onChange={(e) => setCustomAmount(Number(e.target.value))}
          className="border px-3 py-2 rounded w-24 text-center"
        />
        <button
          onClick={customAantalPils}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Log custom amount
        </button>
        </div>
      </div>
    </main>
    )
  }