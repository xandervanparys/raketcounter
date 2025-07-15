"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"
import { Rocket, Zap, Plus, Minus, Sparkles, Trophy, Target } from "lucide-react"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [raketCount, setRaketCount] = useState<number>(0)
  const [raketCountLoaded, setRaketCountLoaded] = useState<boolean>(false)
  const [frisdrankCount, setFrisdrankCount] = useState<number>(0)
  const [frisdrankCountLoaded, setFrisdrankCountLoaded] = useState<boolean>(false)
  const router = useRouter()
  const [customAmount, setCustomAmount] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

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

  const logRaket = async (amount: number) => {
    if (!user || loading) return
    if (amount <= 0) {
      alert("Geen negatieve pinten fucking ND.")
      return
    }
    setLoading(true)
    const { error } = await supabase.from("raket_logs").insert({
      profile_id: user.id,
      amount,
    })
    setLoading(false)
    if (!error) {
      setRaketCount((prev) => prev + amount)
      setCustomAmount(1)
    } else {
      console.error("Insert error:", error)
      alert("❌ Kon geen raket loggen.")
    }
  }

  const logND = async (amount: number) => {
    if (!user || loading) return
    setLoading(true)
    const { error } = await supabase.from("frisdrank_logs").insert({
      profile_id: user.id,
      amount,
    })
    setLoading(false)
    if (!error) {
      setFrisdrankCount((prev) => prev + amount)
    } else {
      console.error("Insert error:", error)
      alert("❌ Kon geen ND drank loggen.")
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Raketcounter
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 text-purple-200 text-lg"
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span>Launch your rockets to infinity and beyond!</span>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
        </motion.div>

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/10 shadow-2xl"
        >
          <div className="flex flex-col items-center">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-75"></div>
              <img
                src={avatarUrl ?? "/ND_default.png"}
                alt="Avatar"
                className="relative w-28 h-28 rounded-full object-cover border-4 border-white/20 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-400 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Welkom, {username ?? user.email?.split("@")[0]}!</h2>
            <p className="text-purple-200 text-lg">Ready to launch some epic rockets? 🚀</p>
          </div>
        </motion.div>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Rockets Stats */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-xl rounded-2xl p-8 border border-green-400/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-2xl shadow-lg">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Raketten</h3>
                    <p className="text-green-300">Gelanceerd naar de maan</p>
                  </div>
                </div>
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <div className="text-center">
                {raketCountLoaded ? (
                  <motion.div
                    key={raketCount}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl font-bold text-white mb-3"
                  >
                    {raketCount.toLocaleString()}
                  </motion.div>
                ) : (
                  <div className="w-20 h-12 mx-auto bg-white/10 rounded-xl animate-pulse mb-3" />
                )}
                <p className="text-green-200">Total launches 🚀</p>
              </div>
            </div>
          </motion.div>

          {/* ND Drinks Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-pink-500/10 to-rose-600/10 backdrop-blur-xl rounded-2xl p-8 border border-pink-400/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-pink-400 to-rose-500 p-4 rounded-2xl shadow-lg">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">ND Dranken</h3>
                    <p className="text-pink-300">Healthy choices made</p>
                  </div>
                </div>
                <Target className="w-10 h-10 text-pink-400" />
              </div>
              <div className="text-center">
                {frisdrankCountLoaded ? (
                  <motion.div
                    key={frisdrankCount}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl font-bold text-white mb-3"
                  >
                    {frisdrankCount.toLocaleString()}
                  </motion.div>
                ) : (
                  <div className="w-20 h-12 mx-auto bg-white/10 rounded-xl animate-pulse mb-3" />
                )}
                <p className="text-pink-200">Total drinks 🏳️‍🌈</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Center */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Mission Control</h3>
            <p className="text-purple-200">Choose your launch sequence</p>
          </div>

          <div className="max-w-lg mx-auto space-y-4">
            {/* Single Rocket Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logRaket(1)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
            >
              <Rocket className="w-6 h-6 group-hover:animate-bounce" />
              Lanceer een raket 🚀
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>

            {/* Bak Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logRaket(24)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group relative overflow-hidden"
            >
              <Zap className="w-6 h-6 group-hover:animate-pulse" />
              Zet een Bak 🛸
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>

            {/* ND Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logND(1)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group relative overflow-hidden"
            >
              <Sparkles className="w-6 h-6 group-hover:animate-spin" />
              ND button 🏳️‍🌈
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>

            {/* Custom Amount Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCustom((prev) => !prev)}
              className="w-full text-purple-300 hover:text-white transition-colors duration-300 py-3 font-semibold flex items-center justify-center gap-3"
            >
              {showCustom ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showCustom ? "Sluit custom input" : "Voer custom aantal in"}
            </motion.button>

            {/* Custom Amount Input */}
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex gap-4">
                    <input
                      type="number"
                      min="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white text-xl font-semibold placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-center"
                      placeholder="Aantal..."
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => logRaket(customAmount)}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Launch! 🚀
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"
                  />
                  <p className="text-white font-semibold text-lg">Launching rocket...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
