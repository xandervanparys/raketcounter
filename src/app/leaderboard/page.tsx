'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type LeaderboardEntry = {
  user_id: string
  total: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('raket_logs')
        .select('user_id, amount')
      
      if (error) {
        console.error('Error fetching leaderboard:', error)
        return
      }

      const userTotals: Record<string, number> = {}
      data?.forEach((log: { user_id: string; amount: number }) => {
        if (!userTotals[log.user_id]) userTotals[log.user_id] = 0
        userTotals[log.user_id] += log.amount
      })

      const sorted = Object.entries(userTotals)
        .map(([user_id, total]) => ({ user_id, total }))
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
          <li key={entry.user_id} className="bg-gray-100 p-4 rounded shadow">
            <strong>#{index + 1}</strong> – {entry.user_id} 🚀 {entry.total}
          </li>
        ))}
      </ul>
    </main>
  )
}