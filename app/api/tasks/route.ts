import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()

  const payload: any = {
    buildium_task_id: body.buildium_task_id,
    stage: body.stage,
    contractor_name: body.contractor_name || null,
    deadline: body.deadline || null,
    updated_by: body.updated_by,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('task_status')
    .upsert(payload, { onConflict: 'buildium_task_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
