'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type LeaderboardEntry = {
  profile_id: string
  total: number
  username: string | null
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: logs, error: logsError } = await supabase
        .from('raket_logs')
        .select('profile_id, amount')

      if (logsError) {
        console.error('Error fetching raket_logs:', logsError)
        return
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      const usernameMap = new Map<string, string | null>()
      profiles.forEach(p => usernameMap.set(p.id, p.username))

      const userTotals: Record<string, { total: number; username: string | null }> = {}

      logs.forEach(log => {
        if (!userTotals[log.profile_id]) {
          userTotals[log.profile_id] = {
            total: 0,
            username: usernameMap.get(log.profile_id) ?? null,
          }
        }
        userTotals[log.profile_id].total += log.amount
      })

      const sorted = Object.entries(userTotals)
        .map(([profile_id, { total, username }]) => ({ profile_id, total, username }))
        .sort((a, b) => b.total - a.total)

      setLeaderboard(sorted)
    }

    fetchLeaderboard()
  }, [])

  return (
    <main className="p-8">
        <Navbar />
      <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>
      <ul className="space-y-2">
        {leaderboard.map((entry, index) => (
          <li key={entry.profile_id} className="bg-gray-100 p-4 rounded shadow">
            <strong>#{index + 1}</strong> – {entry.username ?? entry.profile_id} 🚀 {entry.total}
          </li>
        ))}
      </ul>
    </main>
  )
}