'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Type definitions for our data
type Project = {
  id: string
  title: string
  description: string
  status: 'active' | 'backlog' | 'idea'
  owner_id: string
  owner_name: string
  repo: string | null
  tags: string[]
  progress: number
  created_at: string
  vote_count?: number
  user_has_voted?: boolean
}

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'backlog' | 'idea'>('all')

  useEffect(() => {
    // Get current logged in user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchProjects(user.id)
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchProjects = async (userId: string) => {
    // Fetch all projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!projectsData) return

    // Fetch vote counts for each project
    const { data: votesData } = await supabase
      .from('votes')
      .select('project_id, user_id')

    // Attach vote counts and whether current user has voted
    const enriched = projectsData.map(p => ({
      ...p,
      vote_count: votesData?.filter(v => v.project_id === p.id).length || 0,
      user_has_voted: votesData?.some(v => v.project_id === p.id && v.user_id === userId) || false
    }))

    setProjects(enriched)
  }

  const handleVote = async (projectId: string, hasVoted: boolean) => {
    if (!user) return

    if (hasVoted) {
      // Remove vote
      await supabase
        .from('votes')
        .delete()
        .match({ project_id: projectId, user_id: user.id })
    } else {
      // Add vote
      await supabase
        .from('votes')
        .insert({ project_id: projectId, user_id: user.id })
    }

    // Refresh projects
    await fetchProjects(user.id)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filtered = projects.filter(p => 
    activeFilter === 'all' ? true : p.status === activeFilter
  )

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Loading...</p>
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

      <main className="px-8 py-8 max-w-6xl mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {(['all', 'active', 'backlog', 'idea'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            No projects yet — hit + New Project to add one
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <div
                key={project.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
              >
                {/* Status + vote */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    project.status === 'active' ? 'bg-emerald-950 text-emerald-400' :
                    project.status === 'backlog' ? 'bg-amber-950 text-amber-400' :
                    'bg-purple-950 text-purple-400'
                  }`}>
                    {project.status}
                  </span>
                  <button
                    onClick={() => handleVote(project.id, project.user_has_voted!)}
                    className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg border transition-colors ${
                      project.user_has_voted
                        ? 'border-purple-500 text-purple-400 bg-purple-950'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    ▲ {project.vote_count}
                  </button>
                </div>

                {/* Title + description */}
                <div>
                  <h3 className="font-bold text-white">{project.title}</h3>
                  <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{project.description}</p>
                </div>

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress bar (active only) */}
                {project.status === 'active' && (
                  <div>
                    <div className="bg-zinc-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="text-zinc-600 text-xs mt-1">{project.progress}% complete</p>
                  </div>
                )}

                {/* Repo */}
                {project.repo && (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 font-mono">
                    ⎇ {project.repo}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-zinc-600 text-xs">{project.owner_name}</span>
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="text-zinc-500 text-xs hover:text-white transition-colors"
                  >
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}