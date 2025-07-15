"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [raketCount, setRaketCount] = useState<number>(0);
  const [raketCountLoaded, setRaketCountLoaded] = useState<boolean>(false);
  const [frisdrankCount, setFrisdrankCount] = useState<number>(0);
  const [frisdrankCountLoaded, setFrisdrankCountLoaded] = useState<boolean>(false);
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) router.push("/login");
      else {
        setUser(data.user);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single();
        if (!error && profile) {
          setUsername(profile.username);
          setAvatarUrl(profile.avatar_url);
        }
      }
    });
  }, [router]);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("raket_logs")
        .select("amount")
        .eq("profile_id", user.id);

      if (!error && data) {
        const totalAmount = data.reduce((sum, log) => sum + log.amount, 0);
        setRaketCount(totalAmount);
        setRaketCountLoaded(true);
      }
    };

    fetchCount();
  }, [user]);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("frisdrank_logs")
        .select("amount")
        .eq("profile_id", user.id);

      if (!error && data) {
        const totalAmount = data.reduce((sum, log) => sum + log.amount, 0);
        setFrisdrankCount(totalAmount);
        setFrisdrankCountLoaded(true);
      }
    };

    fetchCount();
  }, [user]);

  const logRaket = async (amount: number) => {
    if (!user || loading) return;
    if (amount <= 0) {
      alert("Geen negatieve pinten fucking ND.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("raket_logs").insert({
      profile_id: user.id,
      amount,
    });
    setLoading(false);

    if (!error) {
      setRaketCount((prev) => prev + amount);
      setCustomAmount(1);
    } else {
      console.error("Insert error:", error);
      alert("❌ Kon geen raket loggen.");
    }
  };

  const logND = async (amount: number) => {

    if (!user || loading) return;

    setLoading(true);
    const { error } = await supabase.from("frisdrank_logs").insert({
      profile_id: user.id,
      amount, // You can adjust the amount here
    });
    setLoading(false);

    if (!error) {
      setFrisdrankCount((prev) => prev + amount);
    } else {
      console.error("Insert error:", error);
      alert("❌ Kon geen ND drank loggen.");
    } 
  };

  if (!user) return null;

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
            {showCustom ? "Sluit custom input" : "Voer custom aantal in"}
          </button>

          {showCustom && (
            <div className="flex gap-2 mt-2">
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
            </div>
          )}

            <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => logND(1)}
            className="bg-pink-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            ND button 🏳️‍🌈
          </motion.button>
        </div>
      </div>
    </main>
  );
}
}
