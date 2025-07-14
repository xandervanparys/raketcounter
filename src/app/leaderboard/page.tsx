'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type LeaderboardEntry = {
  profile_id: string
  total: number
  username: string | null
  avatar_url: string | null
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
        .select('id, username, avatar_url')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      const profileMap = new Map<
        string,
        { username: string | null; avatar_url: string | null }
      >()
      profiles.forEach(p => {
        profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url })
      })

      const userTotals: Record<
        string,
        { total: number; username: string | null; avatar_url: string | null }
      > = {}

      logs.forEach(log => {
        if (!userTotals[log.profile_id]) {
          const profile = profileMap.get(log.profile_id)
          userTotals[log.profile_id] = {
            total: 0,
            username: profile?.username ?? null,
            avatar_url: profile?.avatar_url ?? null,
          }
        }
        userTotals[log.profile_id].total += log.amount
      })

      const sorted = Object.entries(userTotals)
        .map(([profile_id, { total, username, avatar_url }]) => ({
          profile_id,
          total,
          username,
          avatar_url,
        }))
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
            <div className="flex items-center gap-3">
              <img
                src={entry.avatar_url ?? '/ND_default.png'}
                alt="Avatar"
                className="w-8 h-8 rounded-md object-cover bg-gray-200"
              />
              <div>
                <strong>#{index + 1}</strong> – {entry.username ?? entry.profile_id} 🚀 {entry.total}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}