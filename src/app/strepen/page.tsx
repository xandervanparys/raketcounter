"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, PenLine } from 'lucide-react'

type LeaderboardEntry = {
  profile_id: string
  total: number
  username: string | null
  avatar_url: string | null
}

export default function StrepenLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)

      const { data: logs, error: logsError } = await supabase.from("strepen_logs").select("profile_id, amount")

      if (logsError) {
        console.error("Error fetching strepen_logs:", logsError)
        setLoading(false)
        return
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        setLoading(false)
        return
      }

      const profileMap = new Map<string, { username: string | null; avatar_url: string | null }>()
      profiles.forEach((p) => {
        profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url })
      })

      const userTotals: Record<string, { total: number; username: string | null; avatar_url: string | null }> = {}

      logs.forEach((log) => {
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
      setLoading(false)
    }

    fetchLeaderboard()
  }, [])

  const getInitials = (username: string | null, profileId: string) => {
    if (username) {
      return username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return profileId.slice(0, 2).toUpperCase()
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{index + 1}
          </span>
        )
    }
  }

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
      case 1:
        return "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
      case 2:
        return "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
      default:
        return "bg-card border-border hover:bg-muted/50 hover:scale-[1.02] transition-all duration-200"
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-8">
        <Navbar />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading streepjes leaderboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">✏️ Streepn</h1>
          <p className="text-muted-foreground">Wie heeft de diepste zakken?</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {leaderboard.map((entry, index) => (
            <Card key={entry.profile_id} className={`${getRankStyle(index)} cursor-pointer`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8">{getRankIcon(index)}</div>

                  <Avatar className="w-12 h-12">
                    <AvatarImage src={entry.avatar_url ?? "/ND_default.png"} />
                    <AvatarFallback>{getInitials(entry.username, entry.profile_id)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {entry.username ?? `User ${entry.profile_id.slice(0, 8)}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">Rank #{index + 1}</p>
                  </div>

                  <Badge variant="outline" className="ml-auto">
                    <PenLine className="w-3 h-3 mr-1" />
                    {entry.total.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}