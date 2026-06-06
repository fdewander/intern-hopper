'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type Project = {
  id: string
  title: string
  description: string
  status: 'active' | 'backlog' | 'idea'
  owner_id: string
  owner_name: string
  repo: string | null
  live_url: string | null
  tags: string[]
  progress: number
  created_at: string
  vote_count?: number
  user_has_voted?: boolean
  top_comments?: { content: string; user_name: string }[]
}

function ProjectsList() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const statusParam = searchParams.get('status') as
    | 'active'
    | 'backlog'
    | 'idea'
    | null

  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'backlog' | 'idea'
  >(statusParam || 'all')

  useEffect(() => {
    setActiveFilter(statusParam || 'all')
  }, [statusParam])

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      await fetchProjects(user.id)
      setLoading(false)
    }

    load()
  }, [router])

  const fetchProjects = async (userId: string) => {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectsError || !projectsData) {
      console.error(projectsError)
      return
    }

    const { data: votesData } = await supabase
      .from('votes')
      .select('project_id, user_id')

    const { data: commentsData } = await supabase
      .from('comments')
      .select('project_id, content, user_name, created_at')
      .order('created_at', { ascending: true })

    const enriched: Project[] = projectsData.map((p) => ({
      ...p,
      vote_count:
        votesData?.filter((v) => v.project_id === p.id).length || 0,
      user_has_voted:
        votesData?.some(
          (v) => v.project_id === p.id && v.user_id === userId
        ) || false,
      top_comments:
        commentsData
          ?.filter((c) => c.project_id === p.id)
          .slice(0, 3)
          .map((c) => ({
            content: c.content,
            user_name: c.user_name,
          })) || [],
    }))

    setProjects(enriched)
  }

  const handleVote = async (
    projectId: string,
    hasVoted: boolean
  ) => {
    if (!user) return

    if (hasVoted) {
      await supabase
        .from('votes')
        .delete()
        .match({
          project_id: projectId,
          user_id: user.id,
        })
    } else {
      await supabase.from('votes').insert({
        project_id: projectId,
        user_id: user.id,
      })
    }

    await fetchProjects(user.id)
  }

  const filtered = projects.filter((project) =>
    activeFilter === 'all'
      ? true
      : project.status === activeFilter
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← Home
        </button>

        <h1 className="font-bold text-lg">All Projects</h1>

        <button
          onClick={() => router.push('/projects/new')}
          className="ml-auto bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          + New Project
        </button>
      </header>

      <main className="px-8 py-8 max-w-6xl mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {(['all', 'active', 'backlog', 'idea'] as const).map(
            (filter) => (
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
            )
          )}
        </div>

        {/* Projects grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            No projects here yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
              >
                {/* Status + vote */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      project.status === 'active'
                        ? 'bg-emerald-950 text-emerald-400'
                        : project.status === 'backlog'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-purple-950 text-purple-400'
                    }`}
                  >
                    {project.status}
                  </span>

                  <button
                    onClick={() =>
                      handleVote(
                        project.id,
                        project.user_has_voted ?? false
                      )
                    }
                    className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg border transition-colors ${
                      project.user_has_voted
                        ? 'border-purple-500 text-purple-400 bg-purple-950'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    ▲ {project.vote_count ?? 0}
                  </button>
                </div>

                {/* Title + description */}
                <div>
                  <h3 className="font-bold text-white">
                    {project.title}
                  </h3>
                  <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress */}
                {project.status === 'active' && (
                  <div>
                    <div className="bg-zinc-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                        }}
                      />
                    </div>

                    <p className="text-zinc-600 text-xs mt-1">
                      {project.progress}% complete
                    </p>
                  </div>
                )}

                {/* Repo link */}
                {project.repo && (
                  <a
                    href={`https://github.com/${project.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-400 font-mono transition-colors flex items-center gap-2"
                  >
                    ⎇ {project.repo} ↗
                  </a>
                )}

                {/* Live site link */}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 rounded-lg px-3 py-2 text-xs text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    🌐 {project.live_url} ↗
                  </a>
                )}

                {/* Top comments */}
                {project.top_comments &&
                  project.top_comments.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
                      <p className="text-zinc-600 text-xs uppercase tracking-wider">
                        Comments
                      </p>

                      {project.top_comments.map((comment, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-0.5"
                        >
                          <p className="text-zinc-600 text-xs">
                            {comment.user_name}
                          </p>

                          <p className="text-zinc-400 text-xs line-clamp-1">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                {/* View button */}
                <button
                  onClick={() =>
                    router.push(`/projects/${project.id}`)
                  }
                  className="w-full mt-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  View Project →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
        </div>
      }
    >
      <ProjectsList />
    </Suspense>
  )
}