'use client'
import { useState } from 'react'
import { saveTaskStatus } from '@/app/actions'

const STAGES = [
  { key: 'received', label: 'Received' },
  { key: 'contractor_contacted', label: 'Contractor Contacted' },
  { key: 'appointment_scheduled', label: 'Appt Scheduled' },
  { key: 'work_done', label: 'Work Done' },
  { key: 'tenant_notified', label: 'Tenant Notified' },
  { key: 'closed', label: 'Closed' },
]

export default function StageSelector({
  taskId,
  currentStage,
  currentContractor,
}: {
  taskId: string
  currentStage: string
  currentContractor: string
}) {
  const [stage, setStage] = useState(currentStage)
  const [contractor, setContractor] = useState(currentContractor)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await saveTaskStatus({
        buildium_task_id: parseInt(taskId),
        stage,
        contractor_name: contractor,
        updated_by: 'team',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Follow-up Status</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStage(s.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              stage === s.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contractor Name
        </label>
        <input
          type="text"
          value={contractor}
          onChange={(e) => setContractor(e.target.value)}
          placeholder="e.g. Bob's Plumbing"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Status'}
      </button>
    </div>
  )
}
