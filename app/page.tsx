'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Counts = {
  active: number
  backlog: number
  idea: number
}

type RecentProject = {
  id: string
  title: string
  owner_name: string
  status: string
}

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [counts, setCounts] = useState<Counts>({ active: 0, backlog: 0, idea: 0 })
  const [recent, setRecent] = useState<RecentProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Fetch all projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, owner_name, status')
        .order('created_at', { ascending: false })

      if (projects) {
        setCounts({
          active:  projects.filter(p => p.status === 'active').length,
          backlog: projects.filter(p => p.status === 'backlog').length,
          idea:    projects.filter(p => p.status === 'idea').length,
        })
        // Show 4 most recent across all statuses
        setRecent(projects.slice(0, 4))
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const CATEGORIES = [
    {
      status: 'active',
      label: 'Active',
      description: 'Currently being built',
      count: counts.active,
      accent: '#00e5a0',        // emerald
      bg: 'bg-emerald-950',
      border: 'border-emerald-800',
      text: 'text-emerald-400',
      hover: 'hover:border-emerald-600',
    },
    {
      status: 'backlog',
      label: 'Backlog',
      description: 'Approved, not started',
      count: counts.backlog,
      accent: '#f5a623',        // amber
      bg: 'bg-amber-950',
      border: 'border-amber-800',
      text: 'text-amber-400',
      hover: 'hover:border-amber-600',
    },
    {
      status: 'idea',
      label: 'Ideas',
      description: 'Proposed & up for discussion',
      count: counts.idea,
      accent: '#a78bfa',        // purple
      bg: 'bg-purple-950',
      border: 'border-purple-800',
      text: 'text-purple-400',
      hover: 'hover:border-purple-600',
    },
  ]

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⬡</span>
          <div>
            <h1 className="font-bold text-lg leading-none">Phrasia Hopper</h1>
            <p className="text-zinc-500 text-xs">Intern project tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">{user?.email}</span>
          <button
            onClick={() => router.push('/projects/new')}
            className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            + New Project
          </button>
          <button
            onClick={handleSignOut}
            className="text-zinc-500 text-sm hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-12">

        {/* Welcome */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            What's happening at Phrasia
          </h2>
          <p className="text-zinc-500 mt-2">
            {counts.active + counts.backlog + counts.idea} projects total
            — {counts.active} active right now
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.status}
              onClick={() => router.push(`/projects?status=${cat.status}`)}
              className={`${cat.bg} border ${cat.border} ${cat.hover} rounded-2xl p-8 flex flex-col gap-4 text-left transition-all duration-200 hover:scale-[1.02]`}
            >
              {/* Big number */}
              <div className={`text-6xl font-bold tracking-tighter ${cat.text}`}>
                {cat.count}
              </div>
              <div>
                <div className="text-white font-semibold text-lg">{cat.label}</div>
                <div className="text-zinc-500 text-sm mt-0.5">{cat.description}</div>
              </div>
              <div className={`text-sm ${cat.text} mt-auto`}>
                View all →
              </div>
            </button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recently added</h3>
            <button
              onClick={() => router.push('/projects')}
              className="text-zinc-500 text-sm hover:text-white transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recent.length === 0 && (
              <p className="text-zinc-600 text-sm">No projects yet — add one above</p>
            )}
            {recent.map(p => (
              <button
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-5 py-4 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    p.status === 'active'  ? 'bg-emerald-950 text-emerald-400' :
                    p.status === 'backlog' ? 'bg-amber-950 text-amber-400' :
                    'bg-purple-950 text-purple-400'
                  }`}>
                    {p.status}
                  </span>
                  <span className="font-medium text-white">{p.title}</span>
                </div>
                <span className="text-zinc-600 text-sm">{p.owner_name}</span>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}