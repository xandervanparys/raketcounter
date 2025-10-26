"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Minus, Plus } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [raketCount, setRaketCount] = useState<number>(0);
  const [raketCountLoaded, setRaketCountLoaded] = useState<boolean>(false);
  const [frisdrankCount, setFrisdrankCount] = useState<number>(0);
  const [frisdrankCountLoaded, setFrisdrankCountLoaded] =
    useState<boolean>(false);
  const [strepenCount, setStrepenCount] = useState<number>(0);
  const [strepenCountLoaded, setStrepenCountLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [buzzing] = useState(false);
  const [buzzAmount, setBuzzAmount] = useState<string>("1");
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  const fetchAndSetCount = async (
    table: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    loadedSetter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!user) return;
    const { data, error } = await supabase
      .from(table)
      .select("amount")
      .eq("profile_id", user.id);
    if (!error && data) {
      const totalAmount = data.reduce((sum, log) => sum + log.amount, 0);
      setter(totalAmount);
      loadedSetter(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
  
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
  
      if (!user) {
        router.push("/login");
        if (!cancelled) setChecking(false);
        return;
      }
  
      if (!cancelled) setUser(user);
  
      // Try to load profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
  
      // No profile yet: require invite and let the DB create it via RPC
      if (!profile && profileError?.code === "PGRST116") {
        const inviteCode = localStorage.getItem("inviteCode");
        if (!inviteCode) {
          await supabase.auth.signOut();
          router.push("/login?error=invite_required");
          if (!cancelled) setChecking(false);
          return;
        }
  
        const { error: inviteError } = await supabase.rpc("use_invite", {
          p_code: inviteCode,
        });
  
        if (inviteError) {
          console.error("Invite error", inviteError);
          await supabase.auth.signOut();
          router.push("/login?error=invalid_invite");
          if (!cancelled) setChecking(false);
          return;
        }
  
        // DB has created the profile; clear the invite and fetch it
        localStorage.removeItem("inviteCode");
  
        const { data: profile2, error: profileErr2 } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();
  
        if (profileErr2 || !profile2) {
          // If something unexpected happened, show a soft error
          console.error("Profile fetch after invite failed:", profileErr2);
          router.push("/login?error=insert_profile");
          if (!cancelled) setChecking(false);
          return;
        }
  
        if (!cancelled) {
          setUsername(profile2.username);
          setAvatarUrl(profile2.avatar_url);
          setChecking(false);
        }
        return;
      }
  
      // Profile exists: proceed
      if (profile) {
        if (!cancelled) {
          setUsername(profile.username);
          setAvatarUrl(profile.avatar_url);
        }
      }
      if (!cancelled) setChecking(false);
    })();
  
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    fetchAndSetCount("raket_logs", setRaketCount, setRaketCountLoaded);
    fetchAndSetCount(
      "frisdrank_logs",
      setFrisdrankCount,
      setFrisdrankCountLoaded
    );
    fetchAndSetCount("strepen_logs", setStrepenCount, setStrepenCountLoaded);
  }, [user]);

  const logRaket = async () => {
    if (!user || loading) return;
    setLoading(true);
    const { error } = await supabase.from("raket_logs").insert({
      profile_id: user.id,
      amount: 1,
    });
    setLoading(false);
    if (!error) {
      setRaketCount((prev) => prev + 1);
    } else {
      console.error("Insert error:", error);
      alert("❌ Kon geen raket loggen.");
    }
  };

  const logFrisdrank = async () => {
    if (!user || loading) return;
    setLoading(true);
    const { error } = await supabase.from("frisdrank_logs").insert({
      profile_id: user.id,
      amount: 1,
    });
    if (!error) {
      setFrisdrankCount((prev) => prev + 1);
    } else {
      console.error("Insert error:", error);
      alert("❌ Kon geen ND drank loggen.");
    }
    setLoading(false);
  };

  const logStrepen = async (amount: number) => {
    if (!user || loading) return;
    setLoading(true);
    const { error } = await supabase.from("strepen_logs").insert({
      profile_id: user.id,
      amount,
    });
    setLoading(false);
    if (!error) {
      setStrepenCount((prev) => prev + amount);
    } else {
      console.error("Insert error:", error);
      alert("❌ Kon geen streep loggen.");
    }
  };

  const handleBuzzSubmit = async () => {
    const amount = parseInt(buzzAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Voer positieve raketten in e pipo");
      return;
    }
    await logStrepen(amount);
    setBuzzAmount("1");
    const closeButton = document.querySelector(
      "[data-slot='drawer-close']"
    ) as HTMLButtonElement;
    closeButton?.click();
  };

  if (checking || !user)
    return (
      <main className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div>
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
            Raketcounter laden…
          </p>
        </div>
      </main>
    );

  // if (!user) return null;

  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
          <div>
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
              Raketcounter laden…
            </p>
          </div>
        </main>
      }
    >
      <main className="p-8 text-center">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">
            Welkom bij de Raketcounter
          </h1>
          <div className="hidden md:block">
            <p className="mb-2">Ingelogd als: {username ?? user.email}</p>
            <div className="mb-4">
              <img
                src={avatarUrl ?? "/ND_default.png"}
                alt="Avatar"
                className="w-32 h-32 rounded-lg object-cover mx-auto"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <div className="text-4xl">🚀</div>
              <div className="text-sm text-gray-500">Raketten gelanceerd</div>
              {raketCountLoaded ? (
                <motion.div
                  key={raketCount}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                  className="text-xl font-bold"
                >
                  {raketCount}
                </motion.div>
              ) : (
                <div className="w-8 h-6 mx-auto bg-gray-300 rounded animate-pulse" />
              )}
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <div className="text-4xl">✏️</div>
              <div className="text-sm text-gray-500">Strepen gezet</div>
              {strepenCountLoaded ? (
                <motion.div
                  key={strepenCount}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                  className="text-xl font-bold"
                >
                  {strepenCount}
                </motion.div>
              ) : (
                <div className="w-8 h-6 mx-auto bg-gray-300 rounded animate-pulse" />
              )}
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <div className="text-4xl">🥤</div>
              <div className="text-sm text-gray-500">Aantal ND acties</div>
              {frisdrankCountLoaded ? (
                <motion.div
                  key={frisdrankCount}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                  className="text-xl font-bold"
                >
                  {frisdrankCount}
                </motion.div>
              ) : (
                <div className="w-8 h-6 mx-auto bg-gray-300 rounded animate-pulse" />
              )}
            </div>
            <Drawer>
              <DrawerTrigger asChild>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full h-20 w-20 flex items-center justify-center shadow-lg font-bold text-sm transition-all duration-200 border-4 border-red-800 mx-auto my-auto"
                  disabled={buzzing}
                >
                  BUZZ
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Strepen loggen</DrawerTitle>
                  <DrawerDescription>
                    Geef het aantal strepen in dat je wil loggen.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 py-2">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() =>
                        setBuzzAmount((prev) => {
                          const val = parseInt(prev || "0");
                          return val > 1 ? String(val - 1) : "1";
                        })
                      }
                      className="border border-gray-300 h-10 w-10 rounded-full flex items-center justify-center"
                      disabled={loading}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={buzzAmount}
                      onChange={(e) => setBuzzAmount(e.target.value)}
                      placeholder="Aantal"
                      className="border border-gray-300 rounded px-3 py-2 w-24 text-center"
                      disabled={loading}
                    />
                    <button
                      onClick={() =>
                        setBuzzAmount((prev) => {
                          const val = parseInt(prev || "0");
                          return String(val + 1);
                        })
                      }
                      className="border border-gray-300 h-10 w-10 rounded-full flex items-center justify-center"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleBuzzSubmit}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold transition-colors disabled:opacity-50"
                    >
                      Log strepen
                    </button>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <button className="text-gray-600 hover:text-gray-900 text-sm">
                      Annuleren
                    </button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="space-y-4 w-full max-w-md mx-auto">
            <div className="flex flex-col items-center space-y-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={logRaket}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
                disabled={loading}
              >
                Lanceer een raket 🚀
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => logStrepen(1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
                disabled={loading}
              >
                Streep zetten ✏️
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={logFrisdrank}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
                disabled={loading}
              >
                ND button 🏳️‍🌈
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </Suspense>
  );
}
