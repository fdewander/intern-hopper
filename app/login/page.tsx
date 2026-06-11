'use client'

import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const supabase = createClient()

  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm px-8">

        {/* Phrasia logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-teal-500 opacity-60" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">phrasia</span>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900">Intern Hopper</h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in with your Phrasia account to continue</p>
        </div>

        <button
          onClick={signInWithMicrosoft}
          className="w-full bg-zinc-900 text-white font-semibold rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-zinc-700 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
            <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>

        <p className="text-zinc-300 text-xs text-center">
          Access restricted to @phrasia.com accounts
        </p>
      </div>
    </div>
  )
}