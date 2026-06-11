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
      accent: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950',
      border: 'border-teal-200 dark:border-teal-800',
      hover: 'hover:border-teal-400 dark:hover:border-teal-600',
      tag: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
    },
    {
      status: 'backlog',
      label: 'Backlog',
      description: 'Approved, not started',
      count: counts.backlog,
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      hover: 'hover:border-amber-400 dark:hover:border-amber-600',
      tag: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    },
    {
      status: 'idea',
      label: 'Ideas',
      description: 'Proposed & up for discussion',
      count: counts.idea,
      accent: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950',
      border: 'border-violet-200 dark:border-violet-800',
      hover: 'hover:border-violet-400 dark:hover:border-violet-600',
      tag: 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300',
    },
  ]

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Phrasia-style logo mark */}
          <div className="w-9 h-9 rounded-full border-2 border-teal-500 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-teal-500 opacity-60" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">Phrasia Hopper</h1>
            <p className="text-zinc-400 text-xs mt-0.5">Intern project tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-sm hidden md:block">{user?.email}</span>
<button
            onClick={() => router.push('/projects/new')}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
          >
            + New Project
          </button>
          <button
            onClick={handleSignOut}
            className="text-zinc-400 text-sm hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12 flex flex-col gap-12">

        {/* Welcome */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            What's happening at Phrasia
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">
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
              className={`${cat.bg} border ${cat.border} ${cat.hover} rounded-2xl p-8 flex flex-col gap-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md`}
            >
              <div className={`text-6xl font-bold tracking-tighter ${cat.accent}`}>
                {cat.count}
              </div>
              <div>
                <div className="font-semibold text-lg text-zinc-900 dark:text-white">{cat.label}</div>
                <div className="text-zinc-500 text-sm mt-0.5">{cat.description}</div>
              </div>
              <div className={`text-sm ${cat.accent} mt-auto font-medium`}>
                View all →
              </div>
            </button>
          ))}
        </div>

        {/* Recent activity */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Recently added</h3>
            <button
              onClick={() => router.push('/projects')}
              className="text-zinc-400 text-sm hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recent.length === 0 && (
              <p className="text-zinc-400 text-sm">No projects yet — add one above</p>
            )}
            {recent.map(p => (
              <button
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl px-5 py-4 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    p.status === 'active'  ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' :
                    p.status === 'backlog' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                    'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300'
                  }`}>
                    {p.status}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-white text-sm">{p.title}</span>
                </div>
                <span className="text-zinc-400 text-sm">{p.owner_name}</span>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}