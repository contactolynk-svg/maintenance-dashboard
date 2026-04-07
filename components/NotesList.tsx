'use client'
import { useState } from 'react'

export default function NotesList({
  taskId,
  notes: initialNotes,
}: {
  taskId: string
  notes: any[]
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function addNote() {
    if (!newNote.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/tasks/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildium_task_id: parseInt(taskId),
        note: newNote.trim(),
        author: 'team',
      }),
    })
    const { data } = await res.json()
    setNotes([data, ...notes])
    setNewNote('')
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Notes</h2>
      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note... (e.g. Called tenant, no answer. Will retry tomorrow.)"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addNote}
          disabled={submitting || !newNote.trim()}
          className="mt-2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Adding...' : 'Add Note'}
        </button>
      </div>
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
        {notes.map((note: any) => (
          <div key={note.id} className="border-l-2 border-gray-200 pl-3">
            <p className="text-sm text-gray-800">{note.note}</p>
            <p className="text-xs text-gray-400 mt-1">
              {note.author} · {new Date(note.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
