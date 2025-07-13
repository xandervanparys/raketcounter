'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="mb-6 flex justify-center gap-6">
      <Link href="/" className="mr-4 underline text-blue-600">
        Home
      </Link>
      <Link href="/leaderboard" className="underline text-blue-600">
        Leaderboard
      </Link>
    </nav>
  )
}