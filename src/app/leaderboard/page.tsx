'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type LeaderboardEntry = {
  user_id: string
  count: number
  display_name: string | null
  email: string | null
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: raketData, error } = await supabase
        .from('raket_logs')
        .select('user_id, users ( email, user_metadata )')

      if (error) {
        console.error('Error fetching leaderboard:', error)
        return
      }

      const counts: Record<string, LeaderboardEntry> = {}

      raketData?.forEach((log: any) => {
        const id = log.user_id
        if (!counts[id]) {
          counts[id] = {
            user_id: id,
            count: 0,
            display_name: log.users?.user_metadata?.display_name ?? null,
            email: log.users?.email ?? null,
          }
        }
        counts[id].count += 1
      })

      const sorted = Object.values(counts).sort((a, b) => b.count - a.count)
      setLeaderboard(sorted)
    }

    fetchLeaderboard()
  }, [])

  if (!user) return null

  return (
    <main className="p-8">
      <Navbar />
      <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>
      <ul>
        {leaderboard.map((entry, index) => (
          <li key={entry.user_id} className="mb-2">
            <span className="font-semibold">{index + 1}. </span>
            <span>{entry.display_name || entry.email}</span>: {entry.count} raket(en)
          </li>
        ))}
      </ul>
    </main>
  )
}