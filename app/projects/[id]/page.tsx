'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

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
}

type Comment = {
  id: string
  content: string
  user_name: string
  user_id: string
  created_at: string
}

type Suggestion = {
  id: string
  suggested_by: string
  suggested_by_name: string
  suggestion_status: 'pending' | 'approved' | 'rejected'
  reviewer_note: string | null
  title: string | null
  description: string | null
  status: string | null
  repo: string | null
  tags: string[] | null
  progress: number | null
  created_at: string
}

export default function ProjectPage() {
  const supabase = createClient()
  const router = useRouter()
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [showSuggestForm, setShowSuggestForm] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [suggestion, setSuggestion] = useState({
    title: '',
    description: '',
    status: '',
    repo: '',
    tags: '',
    progress: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      await fetchAll(user.id)
      setLoading(false)
    }
    load()
  }, [id])

  const fetchAll = async (userId: string) => {
    // Fetch project
    const { data: proj } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    setProject(proj)

    // Fetch comments
    const { data: comms } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    setComments(comms || [])

    // Fetch suggestions
    const { data: suggs } = await supabase
      .from('suggestions')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    setSuggestions(suggs || [])
  }

  const submitComment = async () => {
    if (!newComment.trim() || !user) return
    await supabase.from('comments').insert({
      project_id: id,
      user_id: user.id,
      user_name: user.email,
      content: newComment,
    })
    setNewComment('')
    await fetchAll(user.id)
  }

  const submitSuggestion = async () => {
    if (!user) return
    await supabase.from('suggestions').insert({
      project_id: id,
      suggested_by: user.id,
      suggested_by_name: user.email,
      title: suggestion.title || null,
      description: suggestion.description || null,
      status: suggestion.status || null,
      repo: suggestion.repo || null,
      tags: suggestion.tags ? suggestion.tags.split(',').map(t => t.trim()) : null,
      progress: suggestion.progress ? parseInt(suggestion.progress) : null,
    })
    setSuggestion({ title: '', description: '', status: '', repo: '', tags: '', progress: '' })
    setShowSuggestForm(false)
    await fetchAll(user.id)
  }

  const reviewSuggestion = async (suggId: string, action: 'approved' | 'rejected', sugg: Suggestion) => {
    if (action === 'approved' && project) {
      // Apply the suggested changes to the project
      await supabase.from('projects').update({
        ...(sugg.title && { title: sugg.title }),
        ...(sugg.description && { description: sugg.description }),
        ...(sugg.status && { status: sugg.status }),
        ...(sugg.repo && { repo: sugg.repo }),
        ...(sugg.tags && { tags: sugg.tags }),
        ...(sugg.progress !== null && { progress: sugg.progress }),
        updated_at: new Date().toISOString(),
      }).eq('id', project.id)
    }

    // Update suggestion status
    await supabase.from('suggestions').update({
      suggestion_status: action,
      reviewer_note: reviewNote || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', suggId)

    setReviewNote('')
    await fetchAll(user.id)
  }

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    await fetchAll(user.id)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Loading...</p>
    </div>
  )

  if (!project) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Project not found</p>
    </div>
  )

  const isOwner = user?.id === project.owner_id
  const pendingSuggestions = suggestions.filter(s => s.suggestion_status === 'pending')
  const reviewedSuggestions = suggestions.filter(s => s.suggestion_status !== 'pending')

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="font-bold text-lg truncate">{project.title}</h1>
        {isOwner && (
          <button
            onClick={() => router.push(`/projects/${id}/edit`)}
            className="ml-auto text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
          >
            Edit Project
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-10">

        {/* Project details */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              project.status === 'active' ? 'bg-emerald-950 text-emerald-400' :
              project.status === 'backlog' ? 'bg-amber-950 text-amber-400' :
              'bg-purple-950 text-purple-400'
            }`}>
              {project.status}
            </span>
            <span className="text-zinc-600 text-sm">by {project.owner_name}</span>
          </div>

          <p className="text-zinc-300 leading-relaxed">{project.description}</p>

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

          {/* Progress */}
          {project.status === 'active' && (
            <div>
              <div className="bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-emerald-400 h-1.5 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="text-zinc-600 text-xs mt-1">{project.progress}% complete</p>
            </div>
          )}

          {/* Repo */}
          {project.repo && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-400 font-mono">
              ⎇ {project.repo}
            </div>
          )}
        </div>

        {/* Suggest edit button */}
        {!isOwner && (
          <button
            onClick={() => setShowSuggestForm(!showSuggestForm)}
            className="self-start text-sm bg-zinc-900 border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors"
          >
            {showSuggestForm ? 'Cancel' : '✏️ Suggest an Edit'}
          </button>
        )}

        {/* Suggest edit form */}
        {showSuggestForm && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="font-semibold">Suggest changes — only fill in what you want to change</h3>
            {[
              { label: 'Title', key: 'title', placeholder: 'Suggest a new title' },
              { label: 'Description', key: 'description', placeholder: 'Suggest a new description' },
              { label: 'Repo', key: 'repo', placeholder: 'Suggest a repo link' },
              { label: 'Tags', key: 'tags', placeholder: 'Suggest new tags (comma separated)' },
              { label: 'Progress %', key: 'progress', placeholder: 'e.g. 50' },
            ].map(field => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider text-zinc-500">{field.label}</label>
                <input
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-zinc-500"
                  placeholder={field.placeholder}
                  value={suggestion[field.key as keyof typeof suggestion]}
                  onChange={e => setSuggestion(s => ({ ...s, [field.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider text-zinc-500">Status</label>
              <div className="flex gap-2">
                {['', 'idea', 'backlog', 'active'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSuggestion(sg => ({ ...sg, status: s }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                      suggestion.status === s
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s || 'no change'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={submitSuggestion}
              className="bg-white text-black font-semibold py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm"
            >
              Submit Suggestion
            </button>
          </div>
        )}

        {/* Pending suggestions (owner only) */}
        {isOwner && pendingSuggestions.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-lg">
              Pending Suggestions
              <span className="ml-2 text-sm bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full">
                {pendingSuggestions.length}
              </span>
            </h2>
            {pendingSuggestions.map(s => (
              <div key={s.id} className="bg-zinc-900 border border-amber-900 rounded-xl p-5 flex flex-col gap-3">
                <p className="text-zinc-400 text-sm">From {s.suggested_by_name}</p>
                <div className="flex flex-col gap-1 text-sm">
                  {s.title && <p><span className="text-zinc-500">Title:</span> {s.title}</p>}
                  {s.description && <p><span className="text-zinc-500">Description:</span> {s.description}</p>}
                  {s.status && <p><span className="text-zinc-500">Status:</span> {s.status}</p>}
                  {s.repo && <p><span className="text-zinc-500">Repo:</span> {s.repo}</p>}
                  {s.tags && <p><span className="text-zinc-500">Tags:</span> {s.tags.join(', ')}</p>}
                  {s.progress !== null && <p><span className="text-zinc-500">Progress:</span> {s.progress}%</p>}
                </div>
                <input
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none"
                  placeholder="Optional note to reviewer (shown if rejected)"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => reviewSuggestion(s.id, 'approved', s)}
                    className="flex-1 bg-emerald-950 border border-emerald-700 text-emerald-400 font-semibold py-2 rounded-lg hover:bg-emerald-900 transition-colors text-sm"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => reviewSuggestion(s.id, 'rejected', s)}
                    className="flex-1 bg-red-950 border border-red-800 text-red-400 font-semibold py-2 rounded-lg hover:bg-red-900 transition-colors text-sm"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviewed suggestions */}
        {reviewedSuggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-lg">Past Suggestions</h2>
            {reviewedSuggestions.map(s => (
              <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-xs">From {s.suggested_by_name}</p>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    s.suggestion_status === 'approved'
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-red-950 text-red-400'
                  }`}>
                    {s.suggestion_status}
                  </span>
                </div>
                {s.reviewer_note && (
                  <p className="text-zinc-500 text-sm italic">"{s.reviewer_note}"</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-lg">Comments</h2>
          {comments.length === 0 && (
            <p className="text-zinc-600 text-sm">No comments yet — be the first</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex flex-col gap-1 border-b border-zinc-900 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-zinc-500 text-xs">{c.user_name}</p>
                {c.user_id === user?.id && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-zinc-700 hover:text-red-400 text-xs transition-colors"
                  >
                    delete
                  </button>
                )}
              </div>
              <p className="text-zinc-300 text-sm">{c.content}</p>
            </div>
          ))}

          {/* Add comment */}
          <div className="flex gap-3">
            <input
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-zinc-600"
              placeholder="Leave a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
            />
            <button
              onClick={submitComment}
              disabled={!newComment.trim()}
              className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}