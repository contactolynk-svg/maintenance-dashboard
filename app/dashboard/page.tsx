export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-server'
import DashboardClient from '@/components/DashboardClient'

const STAGE_LABELS: Record<string, string> = {
  received: 'Received',
  contractor_contacted: 'Contractor Contacted',
  appointment_scheduled: 'Appt Scheduled',
  work_done: 'Work Done',
  tenant_notified: 'Tenant Notified',
  closed: 'Closed',
}

const STAGE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  received: { bg: '#1e2736', text: '#8892a4', dot: '#8892a4' },
  contractor_contacted: { bg: '#2a1a2e', text: '#f472b6', dot: '#ec4899' },
  appointment_scheduled: { bg: '#2a2410', text: '#fbbf24', dot: '#f59e0b' },
  work_done: { bg: '#1e1a3a', text: '#a78bfa', dot: '#8b5cf6' },
  tenant_notified: { bg: '#2a1f10', text: '#fb923c', dot: '#f97316' },
  closed: { bg: '#0f2a1a', text: '#34d399', dot: '#10b981' },
}

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Small steps every day lead to big results.",
  "Done is better than perfect.",
  "A problem is a chance for you to do your best.",
  "The way to get started is to quit talking and begin doing.",
  "You don't have to be great to start, but you have to start to be great.",
  "Every task you complete is a victory.",
  "Focus on progress, not perfection.",
  "Your work makes a difference — keep going.",
  "Take care of the small things and the big things take care of themselves.",
  "Consistency is the key to excellence.",
  "One task at a time, one day at a time.",
]

async function getWorkOrders() {
  const headers = {
    'x-buildium-client-id': process.env.BUILDIUM_CLIENT_ID!,
    'x-buildium-client-secret': process.env.BUILDIUM_CLIENT_SECRET!,
    'Content-Type': 'application/json',
  }
  const res = await fetch(
    'https://api.buildium.com/v1/tasks/residentrequests?statuses=New,InProgress&orderby=LastUpdatedDateTime+desc&pagesize=50&pagenumber=1',
    { headers, cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default async function DashboardPage() {
  const serverSupabase = await createClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user?.id)
    .maybeSingle()

  const firstName = profile?.first_name ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const quote = QUOTES[dayOfYear % QUOTES.length]

  const workOrders = await getWorkOrders()
  const { data: statuses } = await supabase.from('task_status').select('*')
  const { data: cachedAddresses } = await supabase.from('unit_addresses').select('*')

  const statusMap: Record<number, any> = {}
  statuses?.forEach(s => { statusMap[s.buildium_task_id] = s })

  const addressMap: Record<number, string> = {}
  cachedAddresses?.forEach(a => { addressMap[a.unit_id] = a.address })

  const tasks = workOrders.map((task: any) => {
    const status = statusMap[task.Id]
    const stage = status?.stage ?? 'received'
    const tenant = task.RequestedByUserEntity
      ? `${task.RequestedByUserEntity.FirstName} ${task.RequestedByUserEntity.LastName}`
      : null
    const address = addressMap[task.UnitId] ?? null

    return {
      id: task.Id,
      title: task.Title,
      tenant,
      address,
      unitId: task.UnitId,
      stage,
      contractor: status?.contractor_name ?? null,
      deadline: status?.deadline ?? null,
    }
  })

  const stageCounts: Record<string, number> = {
    received: 0, contractor_contacted: 0, appointment_scheduled: 0,
    work_done: 0, tenant_notified: 0, closed: 0,
  }
  tasks.forEach((t: any) => { if (stageCounts[t.stage] !== undefined) stageCounts[t.stage]++ })

  const dueToday = tasks.filter((t: any) => {
    if (!t.deadline) return false
    const due = new Date(t.deadline)
    const today = new Date()
    return due.toDateString() === today.toDateString()
  }).length

  return (
    <DashboardClient
      tasks={tasks}
      stageCounts={stageCounts}
      stageLabels={STAGE_LABELS}
      stageColors={STAGE_COLORS}
      firstName={firstName}
      greeting={greeting}
      quote={quote}
      dueToday={dueToday}
    />
  )
}
