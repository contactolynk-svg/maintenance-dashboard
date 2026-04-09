'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

function isWithin24hrs(dateStr: string | null) {
  if (!dateStr) return false
  const due = new Date(dateStr).getTime()
  const now = Date.now()
  const diff = due - now
  return diff >= 0 && diff <= 86400000
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr).getTime() < Date.now()
}

const STAGE_ICONS: Record<string, { path: string; viewBox: string }> = {
  received: {
    viewBox: '0 0 24 24',
    path: 'M23.954,5.542,15.536,13.96a5.007,5.007,0,0,1-7.072,0L.046,5.542C.032,5.7,0,5.843,0,6V18a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V6C24,5.843,23.968,5.7,23.954,5.542z M14.122,12.546l9.134-9.135A4.986,4.986,0,0,0,19,1H5A4.986,4.986,0,0,0,.744,3.411l9.134,9.135A3.007,3.007,0,0,0,14.122,12.546z'
  },
  contractor_contacted: {
    viewBox: '0 0 24 24',
    path: 'M12.836.029c-3.474-.235-6.875,1.036-9.328,3.492S-.211,9.378.03,12.854c.44,6.354,6.052,11.146,13.054,11.146h5.917c2.757,0,5-2.243,5-5v-6.66C24,5.862,19.096.454,12.836.029zm-5.836,13.471c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5zm5,0c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5zm5,0c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5z'
  },
  appointment_scheduled: {
    viewBox: '0 0 24 24',
    path: 'M0,8v-1C0,4.243,2.243,2,5,2h1V1c0-.552,.447-1,1-1s1,.448,1,1v1h8V1c0-.552,.447-1,1-1s1,.448,1,1v1h1c2.757,0,5,2.243,5,5v1H0zm24,2v9c0,2.757-2.243,5-5,5H5c-2.757,0-5-2.243-5-5V10H24zm-6.168,3.152c-.384-.397-1.016-.409-1.414-.026l-4.754,4.582c-.376,.376-1.007,.404-1.439-.026l-2.278-2.117c-.403-.375-1.035-.354-1.413,.052-.376,.404-.353,1.037,.052,1.413l2.252,2.092c.566,.567,1.32,.879,2.121,.879s1.556-.312,2.108-.866l4.74-4.568c.397-.383,.409-1.017,.025-1.414z'
  },
  work_done: {
    viewBox: '0 0 24 24',
    path: 'M23.013,3.776l-4.598,4.598c-.781.781-2.047.781-2.828,0-.781-.781-.781-2.047,0-2.828L20.172.959l-.292-.148c-1.062-.539-2.2-.812-3.381-.812-4.136,0-7.5,3.364-7.5,7.5,0,.959.178,1.886.531,2.767L.918,18.879c-1.168,1.17-1.168,3.072,0,4.242.585.585,1.353.877,2.121.877s1.537-.292,2.122-.877l8.631-8.631c.865.339,1.773.51,2.708.51,4.136,0,7.5-3.364,7.5-7.5,0-1.208-.283-2.366-.841-3.442l-.146-.282z'
  },
  tenant_notified: {
    viewBox: '0 0 24 24',
    path: 'M16.899,20c-.465,2.279-2.485,4-4.899,4s-4.435-1.721-4.899-4h9.799zm3.601-13c1.93,0,3.5-1.57,3.5-3.5s-1.57-3.5-3.5-3.5-3.5,1.57-3.5,3.5,1.57,3.5,3.5,3.5zm.24,1.988c-.08.003-.159.012-.24.012-3.033,0-5.5-2.467-5.5-5.5,0-.904.223-1.756.612-2.509-1.182-.635-2.526-.991-3.936-.991C7.775,0,4.398,2.709,3.552,6.516l-2.35,7.597c-.597,1.93.846,3.886,2.866,3.886h15.656c2.08,0,3.529-2.065,2.821-4.021l-1.806-4.992z'
  },
  closed: {
    viewBox: '0 0 512 512',
    path: 'M405.333,179.712v-30.379C405.333,66.859,338.475,0,256,0S106.667,66.859,106.667,149.333v30.379c-38.826,16.945-63.944,55.259-64,97.621v128C42.737,464.214,90.452,511.93,149.333,512h213.333c58.881-0.07,106.596-47.786,106.667-106.667v-128C469.278,234.971,444.159,196.657,405.333,179.712z M277.333,362.667c0,11.782-9.551,21.333-21.333,21.333c-11.782,0-21.333-9.551-21.333-21.333V320c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M362.667,170.667H149.333v-21.333c0-58.91,47.756-106.667,106.667-106.667s106.667,47.756,106.667,106.667V170.667z'
  },
}

export default function DashboardClient({
  tasks,
  stageCounts,
  stageLabels,
  stageColors,
  firstName,
  greeting,
  quote,
  dueToday,
}: {
  tasks: any[]
  stageCounts: Record<string, number>
  stageLabels: Record<string, string>
  stageColors: Record<string, { bg: string; text: string; dot: string }>
  firstName: string
  greeting: string
  quote: string
  dueToday: number
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Record<number, string>>(
  Object.fromEntries(tasks.filter(t => t.address).map((t: any) => [t.id, t.address]))
)

useEffect(() => {
  const missing = tasks.filter((t: any) => !t.address && t.unitId)
  missing.forEach(async (task: any) => {
    const res = await fetch(`/api/addresses?unitId=${task.unitId}`)
    const { address } = await res.json()
    if (address) setAddresses(prev => ({ ...prev, [task.id]: address }))
  })
}, [])
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const filtered = activeFilter ? tasks.filter(t => t.stage === activeFilter) : tasks
  const total = tasks.length
  const urgentTasks = tasks.filter(t => t.deadline && (isWithin24hrs(t.deadline) || isOverdue(t.deadline)))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
.dash { min-height:.dash { min-height: 100vh; background: #0a1628; font-family: 'DM Sans', sans-serif; color: #c8d3e0; background-image: url('/bg-pattern.svg'); background-repeat: repeat; background-size: 350px 350px; } 100vh; background: #0a1628; font-family: 'DM Sans', sans-serif; color: #c8d3e0; background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><g fill='white' opacity='0.03'><path transform='translate(10,10) scale(1.8)' d='m23 5.5h-3c0-1.379-1.121-2.5-2.5-2.5h-1.366l-1.653-1.378c-1.256-1.046-2.847-1.622-4.481-1.622h-5c-2.757 0-5 2.243-5 5v3c0 2.177 1.407 4.014 3.352 4.699l-.627 5.329c-1.524.141-2.725 1.412-2.725 2.972 0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3s-1.346-3-3-3h-.875l.588-5h.287c1.634 0 3.226-.576 4.48-1.622l1.654-1.378h1.366c1.379 0 2.5-1.121 2.5-2.5h3c.553 0 1-.447 1-1s-.447-1-1-1z'/><path transform='translate(180,20) scale(1.8)' d='m3.688 24c-.032 0-.063 0-.095 0-1.022-.027-1.963-.462-2.649-1.224-1.269-1.409-1.157-3.784.244-5.185l5.868-5.867c.253-.254.344-.631.241-1.009-.358-1.318-.393-2.676-.102-4.036C7.903 3.364 10.626.735 13.972.137c1.006-.18 2.015-.184 3.002-.007.731.129 1.299.625 1.52 1.325.251.799-.003 1.681-.682 2.359l-2.247 2.217c-.658.658-.758 1.69-.222 2.345.308.378.742.598 1.222.622.472.02.936-.155 1.271-.489l2.58-2.55c.539-.539 1.332-.735 2.07-.501.723.227 1.254.828 1.385 1.567c.175.987.172 1.998-.007 3.003-.6 3.347-3.229 6.07-6.544 6.777-1.363.291-2.721.256-4.036-.103-.377-.104-.754-.012-1.008.241l-5.976 5.975c-.69.69-1.637 1.081-2.612 1.081z'/><path transform='translate(100,170) scale(1.8)' d='M20 3c0-1.654-1.346-3-3-3H3C1.346 0 0 1.346 0 3v2c0 1.654 1.346 3 3 3h14c1.654 0 3-1.346 3-3 1.103 0 2 .897 2 2v1c0 1.103-.897 2-2 2h-7c-2.206 0-4 1.794-4 4v.184c-1.161.414-2 1.514-2 2.816v4c0 1.654 1.346 3 3 3s3-1.346 3-3v-4c0-1.302-.839-2.402-2-2.816V14c0-1.103.897-2 2-2h7c2.206 0 4-1.794 4-4V7c0-2.206-1.794-4-4-4z'/></g></svg>"); background-repeat: repeat; }        .dash-nav {
          background: #0d1e35;
          border-bottom: 1px solid #1a2a3f;
          padding: 0 2rem;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 20;
        }
       
        .nav-brand { display: flex; align-items: center; gap: 0.625rem; font-size: 1rem; font-weight: 600; color: #f0f4f8; }
        .nav-icon { width: 30px; height: 30px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .nav-right { display: flex; align-items: center; gap: 0.75rem; }
        .nav-badge { font-family: 'DM Mono', monospace; font-size: 0.78rem; color: #4a6080; background: #111e30; border: 1px solid #1a2a3f; padding: 0.3rem 0.75rem; border-radius: 6px; }
        .logout-btn { font-size: 0.82rem; color: #4a6080; background: none; border: 1px solid #1a2a3f; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .logout-btn:hover { color: #f0f4f8; border-color: #2a3a4f; }
        .dash-body { max-width: 1200px; margin: 0 auto; padding: 2rem 2rem 4rem; }

        .hero {
          background: #0d1e35;
          border: 1px solid #1a2a3f;
          border-radius: 16px;
          padding: 1.75rem 2rem;
          margin-bottom: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        .hero-left {}
        .hero-greeting { font-size: 1.6rem; font-weight: 600; color: #f0f4f8; margin-bottom: 0.375rem; }
        .hero-quote { font-size: 0.88rem; color: #4a6080; font-style: italic; margin-bottom: 1rem; }
        .hero-stats { display: flex; align-items: center; gap: 1.25rem; }
        .hero-stat { display: flex; align-items: center; gap: 0.5rem; }
        .hero-stat-num { font-family: 'DM Mono', monospace; font-size: 1.1rem; font-weight: 600; color: #f0f4f8; }
        .hero-stat-label { font-size: 0.8rem; color: #4a6080; }
        .hero-divider { width: 1px; height: 24px; background: #1a2a3f; }
        .hero-right { flex-shrink: 0; }
        .hero-date { font-family: 'DM Mono', monospace; font-size: 0.78rem; color: #4a6080; text-align: right; }
        .hero-avatar {
          width: 48px;
          height: 48px;
          background: #2563eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-left: auto;
          margin-bottom: 0.5rem;
        }

        .stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.875rem; margin-bottom: 1.75rem; }
        .stat-card { background: #0d1e35; border: 1px solid #1a2a3f; border-radius: 10px; padding: 1rem; cursor: pointer; transition: border-color 0.15s, transform 0.12s; user-select: none; }
        .stat-card:hover { border-color: #2563eb; transform: translateY(-2px); }
        .stat-card.active { border-color: #2563eb; background: #101e35; box-shadow: 0 0 0 1px #2563eb; }
        .stat-icon { width: 22px; height: 22px; margin-bottom: 0.7rem; }
        .stat-num { font-size: 1.9rem; font-weight: 600; color: #f0f4f8; line-height: 1; margin-bottom: 0.35rem; font-family: 'DM Mono', monospace; }
        .stat-label { font-size: 0.76rem; color: #a0aec0; font-weight: 500; }
        .stat-bar { height: 3px; background: #111e30; border-radius: 2px; margin-top: 0.7rem; overflow: hidden; }
        .stat-bar-fill { height: 100%; border-radius: 2px; }

        .main-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; align-items: start; }
        .tasks-panel { background: #0d1e35; border: 1px solid #1a2a3f; border-radius: 12px; overflow: hidden; }
        .panel-head { padding: 1rem 1.25rem; border-bottom: 1px solid #1a2a3f; display: flex; align-items: center; justify-content: space-between; }
        .panel-title { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #3b82f6; }
        .clear-filter { font-size: 0.82rem; color: #3b82f6; cursor: pointer; background: #111e30; border: 1px solid #1a2a3f; padding: 0.3rem 0.75rem; border-radius: 6px; transition: background 0.15s; }
        .clear-filter:hover { background: #1a2a3f; }

        .task-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1.25rem; border-bottom: 1px solid #111e30; text-decoration: none; transition: background 0.1s; }
        .task-item:hover { background: #162840; }
        .task-item:last-child { border-bottom: none; }
        .task-item.urgent { border-left: 3px solid #f97316; }
        .task-item.overdue { border-left: 3px solid #ef4444; background: #1a0a0a; }
        .task-left { flex: 1; min-width: 0; }
        .task-title { font-size: 0.9rem; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.3rem; }
        .task-meta { font-size: 0.82rem; color: #a0aec0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .task-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: #2a3a4f; flex-shrink: 0; }
        .task-contractor { font-size: 0.8rem; color: #a0aec0; margin-top: 0.2rem; }
        .task-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
        .stage-pill { font-size: 0.72rem; font-weight: 600; padding: 0.22rem 0.55rem; border-radius: 20px; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap; }
        .stage-pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .due-badge { font-size: 0.72rem; font-family: 'DM Mono', monospace; padding: 0.18rem 0.5rem; border-radius: 6px; white-space: nowrap; }
        .due-normal { background: #111e30; color: #a0aec0; }
        .due-urgent { background: #450a0a; color: #fca5a5; font-weight: 600; }
        .due-overdue { background: #7f1d1d; color: #fecaca; font-weight: 600; }

        .side-panel { display: flex; flex-direction: column; gap: 1.25rem; }
        .chart-card { background: #0d1e35; border: 1px solid #1a2a3f; border-radius: 12px; padding: 1.25rem; }
        .chart-title { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #3b82f6; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
        .donut-wrap { position: relative; width: 160px; height: 160px; margin: 0 auto 1.25rem; }
        .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .donut-total { font-size: 1.9rem; font-weight: 600; color: #f0f4f8; font-family: 'DM Mono', monospace; line-height: 1; }
        .donut-label { font-size: 0.72rem; color: #a0aec0; margin-top: 0.2rem; }
        .legend-row { display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #111e30; cursor: pointer; }
        .legend-row:last-child { border-bottom: none; }
        .legend-left { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #a0aec0; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-count { font-family: 'DM Mono', monospace; font-size: 0.82rem; color: #f0f4f8; font-weight: 500; }
        .empty-state { text-align: center; padding: 3rem 1rem; color: #a0aec0; font-size: 0.9rem; }
        .urgent-item { display: flex; align-items: center; gap: 0.625rem; text-decoration: none; padding: 0.4rem 0; }
        .urgent-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .urgent-title { font-size: 0.82rem; color: #c8d3e0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .urgent-sub { font-size: 0.74rem; }
        @media (max-width: 900px) { .stats-row { grid-template-columns: repeat(3, 1fr); } .main-grid { grid-template-columns: 1fr; } .hero { flex-direction: column; } }
        @media (max-width: 500px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .dash-body { padding: 1rem; } }
      `}</style>

      <div className="dash">
        <nav className="dash-nav">
          <div className="nav-brand">
            <div className="nav-icon">🔧</div>
            Maintenance Dashboard
          </div>
          <div className="nav-right">
            <span className="nav-badge">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </nav>

        <div className="dash-body">
          {/* Hero Header */}
          <div className="hero">
            <div className="hero-left">
              <div className="hero-greeting">{greeting}, {firstName} 👋</div>
              <div className="hero-quote">"{quote}"</div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-num">{total}</span>
                  <span className="hero-stat-label">open tasks</span>
                </div>
                <div className="hero-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num" style={{ color: dueToday > 0 ? '#f97316' : '#f0f4f8' }}>{dueToday}</span>
                  <span className="hero-stat-label">due today</span>
                </div>
                <div className="hero-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num" style={{ color: urgentTasks.length > 0 ? '#ef4444' : '#f0f4f8' }}>{urgentTasks.length}</span>
                  <span className="hero-stat-label">urgent</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-avatar">{firstName.charAt(0).toUpperCase()}</div>
              <div className="hero-date">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="stats-row">
            {Object.entries(stageLabels).map(([key, label]) => {
              const count = stageCounts[key] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const color = stageColors[key]
              const isActive = activeFilter === key
              const icon = STAGE_ICONS[key]
              return (
                <div key={key} className={'stat-card' + (isActive ? ' active' : '')} onClick={() => setActiveFilter(isActive ? null : key)}>
                  {icon && (
                    <svg className="stat-icon" viewBox={icon.viewBox} fill={color.dot}>
                      <path d={icon.path} />
                    </svg>
                  )}
                  <div className="stat-num">{count}</div>
                  <div className="stat-label">{label}</div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: pct + '%', background: color.dot }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="main-grid">
            <div className="tasks-panel">
              <div className="panel-head">
                <span className="panel-title">{activeFilter ? stageLabels[activeFilter] : 'All Tasks'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {activeFilter && (
                    <button className="clear-filter" onClick={() => setActiveFilter(null)}>Clear ×</button>
                  )}
                  <span style={{ fontFamily: 'DM Mono', fontSize: '0.78rem', color: '#a0aec0' }}>{filtered.length} tasks</span>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">No tasks in this stage.</div>
              ) : (
                filtered.map((task: any) => {
                  const color = stageColors[task.stage]
                  const urgent = isWithin24hrs(task.deadline)
                  const overdue = isOverdue(task.deadline)
                  const cls = 'task-item' + (overdue ? ' overdue' : urgent ? ' urgent' : '')
                  let dueLabel = null
                  let dueClass = 'due-normal'
                  if (task.deadline) {
                    if (overdue) { dueLabel = 'OVERDUE'; dueClass = 'due-overdue' }
                    else if (urgent) { dueLabel = 'Due soon'; dueClass = 'due-urgent' }
                    else { dueLabel = new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); dueClass = 'due-normal' }
                  }
                  return (
                    <Link key={task.id} href={'/tasks/' + task.id} className={cls}>
                      <div className="task-left">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          {task.tenant && <span>{task.tenant}</span>}
                          {task.tenant && addresses[task.id] && <div className="task-meta-dot" />}
                          {addresses[task.id] && <span>{addresses[task.id]}</span>}
                          <div className="task-meta-dot" />
                          <span style={{ fontFamily: 'DM Mono' }}>#{task.id}</span>
                        </div>
                        {task.contractor && <div className="task-contractor">🔧 {task.contractor}</div>}
                      </div>
                      <div className="task-right">
                        <div className="stage-pill" style={{ background: color.bg, color: color.text }}>
                          <div className="stage-pill-dot" style={{ background: color.dot }} />
                          {stageLabels[task.stage]}
                        </div>
                        {dueLabel && <div className={'due-badge ' + dueClass}>{dueLabel}</div>}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            <div className="side-panel">
              <div className="chart-card">
                <div className="chart-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f87171">
                    <path d="M16,10c-.552,0-1-.448-1-1s.448-1,1-1h8v-1c0-2.757-2.243-5-5-5h-1V1c0-.552-.448-1-1-1s-1,.448-1,1v1H8V1c0-.552-.448-1-1-1s-1,.448-1,1v1h-1C2.243,2,0,4.243,0,7v1H8c.552,0,1,.448,1,1s-.448,1-1,1H0v9c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5V10h-8Zm-4,11c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm1-5c0,.552-.448,1-1,1s-1-.448-1-1v-7c0-.552,.448-1,1-1s1,.448,1,1v7Z"/>
                  </svg>
                  Due Soon
                </div>
                {urgentTasks.length === 0 ? (
                  <div style={{ fontSize: '0.84rem', color: '#a0aec0', textAlign: 'center', padding: '1rem 0' }}>No urgent deadlines</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {urgentTasks.map(task => (
                      <Link key={task.id} href={'/tasks/' + task.id} className="urgent-item">
                        <div className="urgent-dot" style={{ background: isOverdue(task.deadline) ? '#ef4444' : '#f97316' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="urgent-title">{task.title}</div>
                          <div className="urgent-sub" style={{ color: isOverdue(task.deadline) ? '#fca5a5' : '#fb923c' }}>
                            {isOverdue(task.deadline) ? 'Overdue' : 'Due within 24hrs'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="chart-card">
                <div className="chart-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15">
                    <path d="M1.327,12.4,4.887,15,3.535,19.187A3.178,3.178,0,0,0,4.719,22.8a3.177,3.177,0,0,0,3.8-.019L12,20.219l3.482,2.559a3.227,3.227,0,0,0,4.983-3.591L19.113,15l3.56-2.6a3.227,3.227,0,0,0-1.9-5.832H16.4L15.073,2.432a3.227,3.227,0,0,0-6.146,0L7.6,6.568H3.231a3.227,3.227,0,0,0-1.9,5.832Z"/>
                  </svg>
                  By Stage
                </div>
                <div className="donut-wrap">
                  <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    {(() => {
                      const radius = 60
                      const circumference = 2 * Math.PI * radius
                      let offset = 0
                      return Object.entries(stageCounts).map(([key, count]) => {
                        const pct = total > 0 ? count / total : 0
                        const dash = pct * circumference
                        const el = (
                          <circle key={key} cx="80" cy="80" r={radius} fill="none"
                            stroke={stageColors[key].dot} strokeWidth="18"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset} opacity={count === 0 ? 0 : 1}
                          />
                        )
                        offset += dash
                        return el
                      })
                    })()}
                    <circle cx="80" cy="80" r="51" fill="#0a1628" />
                  </svg>
                  <div className="donut-center">
                    <div className="donut-total">{activeFilter ? (stageCounts[activeFilter] ?? 0) : total}</div>
                    <div className="donut-label">{activeFilter ? stageLabels[activeFilter] : 'total'}</div>
                  </div>
                </div>
                <div>
                  {Object.entries(stageLabels).map(([key, label]) => (
                    <div key={key} className="legend-row"
                      style={{ opacity: activeFilter && activeFilter !== key ? 0.4 : 1 }}
                      onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                    >
                      <div className="legend-left">
                        <div className="legend-dot" style={{ background: stageColors[key].dot }} />
                        {label}
                      </div>
                      <div className="legend-count">{stageCounts[key] ?? 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
