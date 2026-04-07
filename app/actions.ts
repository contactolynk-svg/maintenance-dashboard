'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveTaskStatus({
  buildium_task_id,
  stage,
  contractor_name,
  updated_by,
}: {
  buildium_task_id: number
  stage: string
  contractor_name: string
  updated_by: string
}) {
  const { data, error } = await supabase
    .from('task_status')
    .upsert(
      { buildium_task_id, stage, contractor_name, updated_by, updated_at: new Date().toISOString() },
      { onConflict: 'buildium_task_id' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath(`/tasks/${buildium_task_id}`)

  return data
}
