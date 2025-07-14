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
      const { data, error } = await supabase
        .from('raket_logs')
        .select('profile_id, amount, profiles!inner(username)')
        .order('amount', { ascending: false })

      if (error) {
        console.error('Error fetching leaderboard:', error)
        return
      }

      const userTotals: Record<string, { total: number; username: string | null }> = {}

      data?.forEach((log: any) => {
        const profile = log.profiles as { username: string | null };
        if (!userTotals[log.profile_id]) {
          userTotals[log.profile_id] = { total: 0, username: profile?.username ?? null }
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