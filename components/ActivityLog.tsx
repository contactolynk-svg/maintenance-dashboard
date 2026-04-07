'use client'
import { useState } from 'react'

const STAGES = [
  { key: 'received', label: 'Received', color: '#8892a4', bg: '#1e2736' },
  { key: 'contractor_contacted', label: 'Contractor Contacted', color: '#f472b6', bg: '#2a1a2e' },
  { key: 'appointment_scheduled', label: 'Appt Scheduled', color: '#fbbf24', bg: '#2a2410' },
  { key: 'work_done', label: 'Work Done', color: '#a78bfa', bg: '#1e1a3a' },
  { key: 'tenant_notified', label: 'Tenant Notified', color: '#fb923c', bg: '#2a1f10' },
  { key: 'closed', label: 'Closed', color: '#34d399', bg: '#0f2a1a' },
]

export default function ActivityLog({
  taskId,
  currentStage,
  currentContractor,
  currentDeadline,
  entries: initialEntries,
}: {
  taskId: string
  currentStage: string
  currentContractor: string
  currentDeadline?: string | null
  entries: any[]
}) {
  const [stage, setStage] = useState(currentStage)
  const [contractor, setContractor] = useState(currentContractor)
  const [deadline, setDeadline] = useState(currentDeadline ?? '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState(initialEntries)
  const [displayStage, setDisplayStage] = useState(currentStage)
  const [displayContractor, setDisplayContractor] = useState(currentContractor)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function save() {
    setSaving(true)

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildium_task_id: parseInt(taskId),
        stage,
        contractor_name: contractor,
        deadline: deadline || null,
        updated_by: 'team',
      }),
    })

    const noteRes = await fetch('/api/tasks/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildium_task_id: parseInt(taskId),
        stage,
        contractor_name: contractor,
        note: note.trim() || null,
        author: 'team',
      }),
    })

    const { data: newEntry } = await noteRes.json()
    setEntries([newEntry, ...entries])
    setDisplayStage(stage)
    setDisplayContractor(contractor)
    setSaving(false)
    setSaved(true)
    setNote('')
    setTimeout(() => setSaved(false), 2000)
  }

  async function deleteEntry(id: string) {
    setDeletingId(id)
    await fetch('/api/tasks/notes?id=' + id, { method: 'DELETE' })
    setEntries(entries.filter(e => e.id !== id))
    setDeletingId(null)
  }

  const isOverdue = deadline && new Date(deadline).getTime() < Date.now()
  const isUrgent = deadline && !isOverdue && (new Date(deadline).getTime() - Date.now()) < 86400000

  return (
    <>
      <style>{`
        .activity-card {
          background: #131d2e;
          border: 1px solid #1e2a3a;
          border-radius: 12px;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }
        .activity-title {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 1.25rem;
        }
        .stage-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
        .stage-btn {
          padding: 0.375rem 0.875rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid #1e2a3a;
          background: #0f1623;
          color: #8892a4;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .stage-btn:hover { border-color: #3b82f6; color: #60a5fa; }
        .stage-btn.active { border-color: #3b82f6; background: #1a2a4a; color: #60a5fa; }
        .field-label {
          display: block;
          font-size: 0.76rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4a5568;
          margin-bottom: 0.375rem;
        }
        .dark-input {
          width: 100%;
          background: #0f1623;
          border: 1px solid #1e2a3a;
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          font-size: 0.9rem;
          color: #c8d3e0;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .dark-input:focus { outline: none; border-color: #3b82f6; }
        .dark-input::placeholder { color: #4a5568; }
        .dark-input.urgent { border-color: #f97316; }
        .dark-input.overdue { border-color: #ef4444; }
        .deadline-hint {
          font-size: 0.78rem;
          margin-top: 0.375rem;
          font-weight: 500;
        }
        .fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .save-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .save-btn:hover { background: #1d4ed8; }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .timeline-title {
          font-size: 0.76rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4a5568;
          margin-bottom: 1rem;
          padding-top: 1.25rem;
          border-top: 1px solid #1e2a3a;
        }
        .timeline-entry { display: flex; gap: 0.875rem; position: relative; }
        .timeline-line { display: flex; flex-direction: column; align-items: center; padding-top: 0.25rem; }
        .timeline-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .timeline-connector { width: 1px; flex: 1; background: #1e2a3a; margin-top: 4px; min-height: 20px; }
        .timeline-body { flex: 1; padding-bottom: 1.25rem; }
        .timeline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
        .timeline-badges { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .timeline-stage-badge { font-size: 0.76rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 10px; }
        .timeline-time { font-size: 0.78rem; color: #4a5568; font-family: 'DM Mono', monospace; }
        .remove-btn { font-size: 0.76rem; color: #2a3a4a; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; padding: 0; }
        .timeline-entry:hover .remove-btn { color: #ef4444; }
        .timeline-note { font-size: 0.9rem; color: #c8d3e0; line-height: 1.6; margin-top: 0.25rem; }
        .timeline-contractor { font-size: 0.84rem; color: #60a5fa; margin-top: 0.2rem; }
        .timeline-author { font-size: 0.78rem; color: #2a3a4a; margin-top: 0.25rem; }
      `}</style>

      <div className="activity-card">
        <div className="activity-title">Update Status</div>

        <div className="stage-buttons">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={'stage-btn' + (stage === s.key ? ' active' : '')}
              style={stage === s.key ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>

<div className="fields-row">
  <div>
    <label className="field-label">Contractor Name</label>
    <select
      value={contractor}
      onChange={(e) => setContractor(e.target.value)}
      className="dark-input"
    >
      <option value="">-- Select contractor --</option>
      <option value="Green Way">Green Way</option>
      <option value="Around The Clock">Around The Clock</option>
      <option value="Holland">Holland</option>
      <option value="Derrick">Derrick</option>
      <option value="Rich">Rich</option>
      <option value="Alfredo Hernandez">Alfredo Hernandez</option>
      <option value="Ivan's Roofing">Ivan's Roofing</option>
      <option value="Guardian Mold Expert">Guardian Mold Expert</option>
      <option value="Feikema Plumbing">Feikema Plumbing</option>
      <option value="Aqua Quest">Aqua Quest</option>
    </select>
  
          </div>
          <div>
            <label className="field-label">Deadline</label>
            <input list="contractors-list"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={'dark-input' + (isOverdue ? ' overdue' : isUrgent ? ' urgent' : '')}
            />
            {isOverdue && <div className="deadline-hint" style={{ color: '#ef4444' }}>⚠ Overdue!</div>}
            {isUrgent && <div className="deadline-hint" style={{ color: '#f97316' }}>⚠ Due within 24hrs</div>}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="field-label">Note <span style={{ color: '#2a3a4a', textTransform: 'none', letterSpacing: '0', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Called tenant, no answer. Will retry tomorrow."
            rows={3}
            className="dark-input"
            style={{ resize: 'vertical' }}
          />
        </div>

        <button onClick={save} disabled={saving} className="save-btn">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Update'}
        </button>

        {entries.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="timeline-title">Activity Timeline</div>
            <div>
              {entries.map((entry: any, i: number) => {
                const entryStage = STAGES.find(s => s.key === entry.stage) ?? STAGES[0]
                return (
                  <div key={entry.id ?? i} className="timeline-entry">
                    <div className="timeline-line">
                      <div className="timeline-dot" style={{ background: entryStage.color }} />
                      {i < entries.length - 1 && <div className="timeline-connector" />}
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-header">
                        <div className="timeline-badges">
                          <span className="timeline-stage-badge" style={{ background: entryStage.bg, color: entryStage.color }}>
                            {entryStage.label}
                          </span>
                          <span className="timeline-time">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          disabled={deletingId === entry.id}
                          className="remove-btn"
                        >
                          {deletingId === entry.id ? '...' : 'remove'}
                        </button>
                      </div>
                      {entry.contractor_name && (
                        <div className="timeline-contractor">🔧 {entry.contractor_name}</div>
                      )}
                      {entry.note && (
                        <div className="timeline-note">{entry.note}</div>
                      )}
                      <div className="timeline-author">{entry.author}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
