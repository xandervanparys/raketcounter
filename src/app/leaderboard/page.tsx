"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Rocket } from "lucide-react"

type LeaderboardEntry = {
  profile_id: string
  total: number
  username: string | null
  avatar_url: string | null
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)

      const { data: logs, error: logsError } = await supabase.from("raket_logs").select("profile_id, amount")

      if (logsError) {
        console.error("Error fetching raket_logs:", logsError)
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
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-950/20 dark:to-amber-950/20 dark:border-yellow-800"
      case 1:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/20 dark:to-slate-950/20 dark:border-gray-800"
      case 2:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800"
      default:
        return "bg-card border-border hover:bg-muted/50 transition-colors"
    }
  }

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

  if (loading) {
    return (
      <main className="min-h-screen bg-background pt-16">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-muted-foreground">Top performers ranked by total rockets</p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            {/* Second Place */}
            <Card className={`${getRankStyle(1)} order-1 md:order-1`}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">{getRankIcon(1)}</div>
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={leaderboard[1].avatar_url ?? "/ND_default.png"} />
                  <AvatarFallback>{getInitials(leaderboard[1].username, leaderboard[1].profile_id)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg mb-1">
                  {leaderboard[1].username ?? `User ${leaderboard[1].profile_id.slice(0, 8)}`}
                </h3>
                <Badge variant="secondary" className="mb-2">
                  <Rocket className="w-3 h-3 mr-1" />
                  {leaderboard[1].total.toLocaleString()}
                </Badge>
              </CardContent>
            </Card>

            {/* First Place */}
            <Card className={`${getRankStyle(0)} order-2 md:order-2 md:scale-110 md:z-10`}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">{getRankIcon(0)}</div>
                <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-yellow-200 dark:ring-yellow-800">
                  <AvatarImage src={leaderboard[0].avatar_url ?? "/ND_default.png"} />
                  <AvatarFallback>{getInitials(leaderboard[0].username, leaderboard[0].profile_id)}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-xl mb-1">
                  {leaderboard[0].username ?? `User ${leaderboard[0].profile_id.slice(0, 8)}`}
                </h3>
                <Badge className="mb-2 bg-yellow-500 hover:bg-yellow-600">
                  <Rocket className="w-3 h-3 mr-1" />
                  {leaderboard[0].total.toLocaleString()}
                </Badge>
                <p className="text-xs text-muted-foreground">👑 Champion</p>
              </CardContent>
            </Card>

            {/* Third Place */}
            <Card className={`${getRankStyle(2)} order-3 md:order-3`}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">{getRankIcon(2)}</div>
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={leaderboard[2].avatar_url ?? "/ND_default.png"} />
                  <AvatarFallback>{getInitials(leaderboard[2].username, leaderboard[2].profile_id)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg mb-1">
                  {leaderboard[2].username ?? `User ${leaderboard[2].profile_id.slice(0, 8)}`}
                </h3>
                <Badge variant="secondary" className="mb-2">
                  <Rocket className="w-3 h-3 mr-1" />
                  {leaderboard[2].total.toLocaleString()}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rest of the leaderboard */}
        <div className="max-w-2xl mx-auto space-y-3">
          {leaderboard.slice(3).map((entry, index) => (
            <Card key={entry.profile_id} className={getRankStyle(index + 3)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8">{getRankIcon(index + 3)}</div>

                  <Avatar className="w-12 h-12">
                    <AvatarImage src={entry.avatar_url ?? "/ND_default.png"} />
                    <AvatarFallback>{getInitials(entry.username, entry.profile_id)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {entry.username ?? `User ${entry.profile_id.slice(0, 8)}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">Rank #{index + 4}</p>
                  </div>

                  <Badge variant="outline" className="ml-auto">
                    <Rocket className="w-3 h-3 mr-1" />
                    {entry.total.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {leaderboard.length === 0 && !loading && (
          <div className="text-center py-12">
            <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground">Be the first to appear on the leaderboard!</p>
          </div>
        )}
      </div>
    </main>
  )
}
