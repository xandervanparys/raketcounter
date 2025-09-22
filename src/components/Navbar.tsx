"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Settings, LogOut, Euro, MailPlus, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isKasleider, setKasleider] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        const uid = data.user.id;
        setUserEmail(data.user.email ?? null);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", uid)
          .single();

        if (!error && profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        } else {
          // Fallback to auth metadata (e.g., first Google login) or default
          type Meta = { avatar_url?: string };
          const meta = data.user.user_metadata as Meta | null | undefined;
          const metaUrl = meta?.avatar_url;
          setAvatarUrl(metaUrl ?? "/ND_default.png");
        }
        // Check KAS role via RPC (uses auth.uid() by default)
        try {
          const { data: kasRes, error: kasErr } = await supabase.rpc("is_kas");
          if (kasErr) {
            console.warn("is_kas RPC error:", kasErr);
          } else {
            setKasleider(Boolean(kasRes));
          }
        } catch (e) {
          console.warn("is_kas RPC threw:", e);
        }
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setOpen(false);
    router.push("/login");
  };

  const generateInvite = async () => {
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.rpc("generate_invite");
      if (error) {
        console.error("Error generating invite:", error);
        setInviteLoading(false);
        return;
      }
      const inviteCode = data as string;
      const url = `${window.location.origin}/invite/${inviteCode}`;
      setInviteLink(url);
      setInviteOpen(true);
    } catch (e) {
      console.error("Exception generating invite:", e);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              🚀
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Leaderboard
              </Link>
              <Link
                href="/strepen"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Strepers
              </Link>
              <Link
                href="/ndbord"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                ND&#39;s
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {authChecked &&
              (userEmail ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                    title={userEmail}
                  >
                    <img
                      src={avatarUrl ?? "/ND_default.png"}
                      alt="User Avatar"
                      className="h-full w-full object-cover rounded-full"
                    />
                  </button>

                  {open && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Signed in as
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {userEmail}
                        </p>
                      </div>

                      {isKasleider && (
                        <button
                          onClick={() => {
                            router.push("/kas");
                          }}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <Euro className="w-4 h-4 mr-3" />
                          Kas
                        </button>
                      )}

                      <button
                        onClick={generateInvite}
                        disabled={inviteLoading}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MailPlus className="w-4 h-4 mr-3" />
                        Invite drinkers
                      </button>

                      <button
                        onClick={() => {
                          router.push("/settings");
                          setOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/strepen"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                Strepers
              </Link>
              <Link
                href="/ndbord"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                ND&#39;s
              </Link>
            </div>
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
          </DialogHeader>
          <div className="flex space-x-2">
            <Input
              readOnly
              value={inviteLink ?? ""}
              className="flex-1"
              onFocus={(e: { target: { select: () => any; }; }) => e.target.select()}
            />
            <Button
              onClick={() => {
                if (inviteLink) {
                  navigator.clipboard.writeText(inviteLink).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }
              }}
            >
              {copied ? "🍻 Copied!" : (<><Copy className="mr-1" /> Copy</>)}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
