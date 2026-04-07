export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import ActivityLog from '@/components/ActivityLog'

async function getTaskById(id: string) {
  const res = await fetch(
    `https://api.buildium.com/v1/tasks/residentrequests/${id}`,
    {
      headers: {
        'x-buildium-client-id': process.env.BUILDIUM_CLIENT_ID!,
        'x-buildium-client-secret': process.env.BUILDIUM_CLIENT_SECRET!,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [task, { data: status }, { data: entries }] = await Promise.all([
    getTaskById(id),
    supabase.from('task_status').select('*').eq('buildium_task_id', id).maybeSingle(),
    supabase.from('task_notes').select('*').eq('buildium_task_id', id).order('created_at', { ascending: false }),
  ])

  if (!task) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1623', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#8892a4', fontSize: '1rem' }}>Task not found.</p>
          <a href="/dashboard" style={{ color: '#3b82f6', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>← Back to Dashboard</a>
        </div>
      </div>
    )
  }

  const tenantName = task.RequestedByUserEntity
    ? `${task.RequestedByUserEntity.FirstName} ${task.RequestedByUserEntity.LastName}`
    : 'Unknown'

  const address = task.UnitAgreement?.Name ?? null
  const currentStage = status?.stage ?? 'received'

  const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    received: { bg: '#1e2736', text: '#8892a4', dot: '#8892a4' },
    contractor_contacted: { bg: '#2a1a2e', text: '#f472b6', dot: '#ec4899' },
    appointment_scheduled: { bg: '#2a2410', text: '#fbbf24', dot: '#f59e0b' },
    work_done: { bg: '#1e1a3a', text: '#a78bfa', dot: '#8b5cf6' },
    tenant_notified: { bg: '#2a1f10', text: '#fb923c', dot: '#f97316' },
    closed: { bg: '#0f2a1a', text: '#34d399', dot: '#10b981' },
  }

  const STAGE_LABELS: Record<string, string> = {
    received: 'Received',
    contractor_contacted: 'Contractor Contacted',
    appointment_scheduled: 'Appt Scheduled',
    work_done: 'Work Done',
    tenant_notified: 'Tenant Notified',
    closed: 'Closed',
  }

  const stageColor = STAGE_COLORS[currentStage] ?? STAGE_COLORS.received

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .detail-page { min-height: 100vh; background: #0a1628; font-family: 'DM Sans', sans-serif; }
        .detail-header {
          background: #0d1e35;
          border-bottom: 1px solid #1a2a3f;
          padding: 0 2rem;
          height: 60px;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .back-btn {
          color: #3b82f6;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #1e3a5f;
          transition: all 0.15s;
        }
        .back-btn:hover { background: #1e3a5f; }
        .detail-content { max-width: 860px; margin: 0 auto; padding: 2rem 2rem 4rem; }
        .task-id { font-family: 'DM Mono', monospace; font-size: 0.78rem; color: #3b82f6; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .task-title { font-size: 1.75rem; font-weight: 600; color: #f0f4f8; line-height: 1.3; margin-bottom: 0.75rem; }
        .task-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
        .meta-pill {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.84rem;
          color: #8892a4;
          background: #131d2e;
          border: 1px solid #1e2a3a;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
        }
        .stage-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.84rem;
          font-weight: 500;
          padding: 0.3rem 0.875rem;
          border-radius: 20px;
        }
        .stage-dot { width: 6px; height: 6px; border-radius: 50%; }
        .card {
          background: #131d2e;
          border: 1px solid #1e2a3a;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .card-title {
          font-size: 0.76rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 1rem;
        }
        .description-text { font-size: 0.95rem; color: #c8d3e0; line-height: 1.7; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .detail-item label { display: block; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #4a5568; margin-bottom: 0.25rem; }
        .detail-item span { font-size: 0.9rem; color: #c8d3e0; font-weight: 500; }
        .divider { height: 1px; background: #1e2a3a; margin: 1.25rem 0; }
      `}</style>

      <div className="detail-page">
        <div className="detail-header">
          <a href="/dashboard" className="back-btn">← Dashboard</a>
          <div style={{ marginLeft: 'auto' }}>
            <div className="stage-badge" style={{ background: stageColor.bg, color: stageColor.text }}>
              <div className="stage-dot" style={{ background: stageColor.dot }} />
              {STAGE_LABELS[currentStage]}
            </div>
          </div>
        </div>

        <div className="detail-content">
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="task-id">TASK #{task.Id}</div>
            <h1 className="task-title">{task.Title}</h1>
            <div className="task-meta">
              {address && <span className="meta-pill">📍 {address}</span>}
              <span className="meta-pill">👤 {tenantName}</span>
              <span className="meta-pill">📅 {new Date(task.CreatedDateTime).toLocaleDateString()}</span>
              {task.Category?.Name && <span className="meta-pill">{task.Category.Name}</span>}
              {status?.contractor_name && <span className="meta-pill">🔧 {status.contractor_name}</span>}
              {status?.deadline && (
                <span className="meta-pill" style={{ color: new Date(status.deadline) < new Date() ? '#ef4444' : '#f97316' }}>
                  ⏰ Due {new Date(status.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Request Details</div>
            <p className="description-text">{task.Description ?? 'No description provided.'}</p>
            <div className="divider" />
            <div className="details-grid">
              <div className="detail-item">
                <label>Priority</label>
                <span>{task.Priority ?? 'Normal'}</span>
              </div>
              <div className="detail-item">
                <label>Buildium Status</label>
                <span>{task.TaskStatus}</span>
              </div>
              <div className="detail-item">
                <label>Category</label>
                <span>{task.Category?.Name ?? 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated</label>
                <span>{new Date(task.LastUpdatedDateTime).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <ActivityLog
            taskId={id}
            currentStage={currentStage}
            currentContractor={status?.contractor_name ?? ''}
            currentDeadline={status?.deadline ?? null}
            entries={entries ?? []}
          />
        </div>
      </div>
    </>
  )
}
