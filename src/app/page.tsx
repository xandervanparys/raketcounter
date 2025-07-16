"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import { motion } from "framer-motion"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [raketCount, setRaketCount] = useState<number>(0)
  const [raketCountLoaded, setRaketCountLoaded] = useState<boolean>(false)
  const [frisdrankCount, setFrisdrankCount] = useState<number>(0)
  const [frisdrankCountLoaded, setFrisdrankCountLoaded] = useState<boolean>(false)
  const [strepenCount, setStrepenCount] = useState<number>(0)
  const [strepenCountLoaded, setStrepenCountLoaded] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [buzzing, setBuzzing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) router.push("/login")
      else {
        setUser(data.user)
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single()
        if (!error && profile) {
          setUsername(profile.username)
          setAvatarUrl(profile.avatar_url)
        }
      }
    })
  }, [router])

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return
      const { data, error } = await supabase.from("raket_logs").select("amount").eq("profile_id", user.id)
      if (!error && data) {
        const totalAmount = data.reduce((sum, log) => sum + log.amount, 0)
        setRaketCount(totalAmount)
        setRaketCountLoaded(true)
      }
    }
    fetchCount()
  }, [user])

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return
      const { data, error } = await supabase.from("frisdrank_logs").select("amount").eq("profile_id", user.id)
      if (!error && data) {
        const totalAmount = data.reduce((sum, log) => sum + log.amount, 0)
        setFrisdrankCount(totalAmount)
        setFrisdrankCountLoaded(true)
      }
    }
    fetchCount()
  }, [user])

  const logRaket = async () => {
    if (!user || loading) return
    setLoading(true)
    const { error } = await supabase.from("raket_logs").insert({
      profile_id: user.id,
      amount: 1,
    })
    setLoading(false)
    if (!error) {
      setRaketCount((prev) => prev + 1)
    } else {
      console.error("Insert error:", error)
      alert("❌ Kon geen raket loggen.")
    }
  }

  const logND = async () => {
    logFrisdrank()
    logStrepen(1)
  }

  const logFrisdrank = async () => {
    if (!user || loading) return
    setLoading(true)
    const { error } = await supabase.from("frisdrank_logs").insert({
      profile_id: user.id,
      amount: 1,
    })
    if (!error) {
      setFrisdrankCount((prev) => prev + 1)
    } else {
      console.error("Insert error:", error)
      alert("❌ Kon geen ND drank loggen.")
    }
    setLoading(false)
  }

  const logStrepen = async (amount: number) => {
    if (!user || loading) return
    setLoading(true)
    const { error } = await supabase.from("strepen_logs").insert({
      profile_id: user.id,
      amount: 1,
    })
    if (!error) {
      setStrepenCount((prev) => prev + 1)
    } else {
      console.error("Insert error:", error)
      alert("❌ Kon geen streep loggen.")
    }
    setLoading(false)
  }

  const handleBuzz = () => {
    setBuzzing(true)
    // Add vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
    setTimeout(() => {
      setBuzzing(false)
      alert("🔔 Buzzed!")
    }, 600)
  }

  if (!user) return null

  return (
    <main className="p-8 text-center">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Welkom bij de Raketcounter</h1>
        <p className="mb-2">Ingelogd als: {username ?? user.email}</p>
        <div className="mb-4">
          <img
            src={avatarUrl ?? "/ND_default.png"}
            alt="Avatar"
            className="w-32 h-32 rounded-lg object-cover mx-auto"
          />
        </div>
        <p className="mb-4">
          Aantal raketten gelanceerd:{" "}
          {raketCountLoaded ? (
            <motion.div
              key={raketCount}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            >
              <strong>{raketCount}</strong>
            </motion.div>
          ) : (
            <div className="w-8 h-6 mx-auto bg-gray-300 rounded animate-pulse" />
          )}
        </p>
        <p className="mb-4">
          Aantal ND dranken gedronken:{" "}
          {frisdrankCountLoaded ? (
            <motion.div
              key={frisdrankCount}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            >
              <strong>{frisdrankCount}</strong>
            </motion.div>
          ) : (
            <div className="w-8 h-6 mx-auto bg-gray-300 rounded animate-pulse" />
          )}
        </p>

        <div className="space-y-4 w-full max-w-md mx-auto">
          {/* Main action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logRaket}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg h-14 w-full font-medium transition-colors"
              disabled={loading}
            >
              Lanceer een raket 🚀
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => logStrepen(1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg h-14 w-full font-medium transition-colors"
              disabled={loading}
            >
              Strepen zetten ✏️
            </motion.button>
          </div>

          {/* ND button - full width */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logND}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg h-14 w-full font-medium transition-colors"
            disabled={loading}
          >
            ND button 🏳️‍🌈
          </motion.button>

          {/* Emergency Buzz button - prominent and centered */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              animate={
                buzzing
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, -5, 0],
                      backgroundColor: ["#dc2626", "#ef4444", "#dc2626"],
                    }
                  : {}
              }
              transition={{ duration: 0.6, ease: "easeInOut" }}
              onClick={handleBuzz}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full h-20 w-20 flex flex-col items-center justify-center shadow-lg mx-auto font-bold text-sm transition-all duration-200 border-4 border-red-800"
              disabled={buzzing}
            >
              <span>BUZZ</span>
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  )
}
