'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'


export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)
  const [countLoaded, setCountLoaded] = useState(false)
  const router = useRouter()
  const [customAmount, setCustomAmount] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single()
        if (!error) setUsername(profile?.username)
      }
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
        setCountLoaded(true)
      } else if (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchCount()
  }, [user])

  const logRaket = async (amount: number) => {
    if (!user || loading) return
    if (amount <= 0) {
      alert('Geen negatieve pinten fucking ND.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('raket_logs').insert({
      profile_id: user.id,
      amount,
    })
    setLoading(false)

    if (!error) {
      setCountLoaded(false)
      setCount((prev) => prev + amount)
      setTimeout(() => setCountLoaded(true), 0)
      setCustomAmount(1)
    } else {
      console.error('Insert error:', error)
      alert('❌ Kon geen raket loggen.')
    }
  }

  if (!user) return null

  return (
    <main className="p-8 text-center">
      <Navbar />
      <h1 className="text-3xl font-bold mb-4">Welkom bij de Raketcounter</h1>
      <p className="mb-2">Ingelogd als: {username ?? user.email}</p>
      {countLoaded && (
        <motion.p
          className="mb-4"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.4, times: [0, 0.2, 1] }}
        >
          Aantal raketten gelanceerd: <strong>{count}</strong>
        </motion.p>
      )}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => logRaket(1)}
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Lanceer een raket 🚀
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => logRaket(24)}
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Zet een Bak 🛸
        </motion.button>

        <button
          onClick={() => setShowCustom((prev) => !prev)}
          className="text-sm underline text-blue-600"
        >
          {showCustom ? 'Sluit custom input' : 'Voer custom aantal in'}
        </button>

        <AnimatePresence>
          {showCustom && (
            <motion.div
              className="flex gap-2 mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                className="border px-3 py-2 rounded w-24 text-center"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => logRaket(customAmount)}
                className="bg-green-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Log custom amount
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}