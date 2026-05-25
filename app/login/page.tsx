'use client' // This tells Next.js this component runs in the browser, not on the server
             // Needed because we're using browser APIs like window.location

import { createClient } from '@/lib/supabase' // Import our Supabase client we set up earlier

export default function LoginPage() {
  // Create a Supabase client instance for this component
  const supabase = createClient()

  // This function runs when the user clicks "Sign in with Microsoft"
  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure', // Microsoft OAuth in Supabase is called "azure"
      options: {
        scopes: 'email', // Request access to the user's email address
                         // This is how we know they're a phrasia.com account
        redirectTo: `${window.location.origin}/auth/callback`,
        // After Microsoft authenticates the user, send them to this URL
        // which completes the login (same callback route as before)
      },
    })
    // What happens behind the scenes:
    // 1. User clicks button
    // 2. Supabase redirects to Microsoft's login page
    // 3. User signs in with their phrasia.com Microsoft account
    // 4. Microsoft sends them back to /auth/callback with a special code
    // 5. Our callback route exchanges that code for a session
    // 6. User is now logged in and redirected to the main app
  }

  return (
    // min-h-screen = takes up full screen height
    // bg-black = black background
    // flex items-center justify-center = centers everything on screen
    <div className="min-h-screen bg-black flex items-center justify-center">

      {/* The login card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center gap-6 w-full max-w-sm">

        {/* Phrasia logo mark */}
        <div className="text-3xl">⬡</div>

        <div className="text-center">
          <h1 className="text-white text-xl font-bold">Phrasia Hopper</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in with your Phrasia account</p>
        </div>

        {/* The Microsoft sign in button */}
        <button
          onClick={signInWithMicrosoft}
          className="w-full bg-white text-black font-semibold rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-zinc-100 transition-colors"
        >
          {/* Official Microsoft logo - four colored squares */}
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/> {/* Red square */}
            <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/> {/* Green square */}
            <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/> {/* Blue square */}
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/> {/* Yellow square */}
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  )
}