"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== "undefined" 
          ? `${window.location.origin}/`
          : undefined,
      },
    });

    if (error) alert(error.message);
  }

  const loginWithEmail = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    if (error) alert(error.message);
    else alert("Check your email for the login link!");
  };

  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Raketcounter 🚀</h1>
      <div className="mb-6">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-3 py-2 rounded mr-2"
        />
        <button
          onClick={loginWithEmail}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Email Login
        </button>
      </div>
      <button
        onClick={loginWithGoogle}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Log in with Google
      </button>
    </main>
  );
}
