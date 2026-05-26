'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'idea' as 'active' | 'backlog' | 'idea',
    repo: '',
    tags: '',
    progress: 0,
  })

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Insert project into database
    const { error } = await supabase.from('projects').insert({
      title: form.title,
      description: form.description,
      status: form.status,
      repo: form.repo || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      progress: form.progress,
      owner_id: user.id,
      owner_name: user.email,
    })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    // Redirect back to dashboard on success
    router.push('/')
  }

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
        <h1 className="font-bold text-lg">New Project</h1>
      </header>

      <main className="max-w-xl mx-auto px-8 py-10 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500">Title *</label>
          <input
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            placeholder="What are you building?"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500">Description</label>
          <textarea
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none h-28"
            placeholder="What problem does it solve?"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500">Status</label>
          <div className="flex gap-3">
            {(['idea', 'backlog', 'active'] as const).map(s => (
              <button
                key={s}
                onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                  form.status === s
                    ? s === 'active' ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : s === 'backlog' ? 'bg-amber-950 border-amber-500 text-amber-400'
                      : 'bg-purple-950 border-purple-500 text-purple-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Progress (only show if active) */}
        {form.status === 'active' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-zinc-500">
              Progress — {form.progress}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) }))}
              className="accent-emerald-400"
            />
          </div>
        )}

        {/* Repo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500">GitHub Repo (optional)</label>
          <input
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono text-sm"
            placeholder="e.g. Phrasia-Ltd/intern-hopper"
            value={form.repo}
            onChange={e => setForm(f => ({ ...f, repo: e.target.value }))}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500">Tags (comma separated)</label>
          <input
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            placeholder="e.g. web-app, automation, research"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !form.title.trim()}
          className="bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </main>
    </div>
  )
}