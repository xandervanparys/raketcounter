'use client'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data?.user?.email ?? null)
      }
    })
  }, [])

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [])

  return (
    <nav className="relative mb-6 flex justify-center items-center">
      <div className="flex gap-6">
        <Link href="/" className="underline text-blue-600">
          Home
        </Link>
        <Link href="/leaderboard" className="underline text-blue-600">
          Leaderboard
        </Link>
      </div>

      {userEmail && (
        <div className="absolute right-4" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-400 focus:outline-none"
            title={userEmail}
          >
            <span className="text-gray-700 font-bold">
              {userEmail[0].toUpperCase()}
            </span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-50">
              <button
                onClick={() => {
                  router.push('/settings')
                  setOpen(false)
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}