// This is a Next.js API route - it's a URL endpoint, not a visible page
// It lives at /auth/callback and handles the redirect back from Google

import { createServerClient } from '@supabase/ssr' // Server-side Supabase client
                                                    // Different from the browser client
                                                    // because it runs on the server
import { cookies } from 'next/headers'             // Next.js utility to read/write cookies
                                                    // Cookies are how we store the login session
import { NextResponse } from 'next/server'          // Used to send HTTP responses

// This GET function runs automatically when someone visits /auth/callback
// Next.js knows it's a GET handler because it's exported as "GET"
export async function GET(request: Request) {
  
  // Pull apart the URL to get the query parameters and the base URL
  // e.g. http://localhost:3000/auth/callback?code=abc123
  const { searchParams, origin } = new URL(request.url)
  
  // Google sends back a one-time "code" in the URL after the user logs in
  // e.g. ?code=abc123xyz
  // We need this code to get the actual session from Supabase
  const code = searchParams.get('code')

  if (code) {
    // Get access to the browser's cookies so we can store the session
    const cookieStore = await cookies()
    
    // Create a server-side Supabase client
    // This version needs cookie access because sessions are stored in cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // These two functions tell Supabase how to read and write cookies
          // Supabase handles the actual session logic, we just give it cookie access
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // This is the key step - exchange the one-time code from Google
    // for a real Supabase session (which gets stored in cookies)
    // After this the user is officially logged in
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect the user to the homepage now that they're logged in
  // origin is just the base URL e.g. http://localhost:3000
  return NextResponse.redirect(`${origin}/`)
}