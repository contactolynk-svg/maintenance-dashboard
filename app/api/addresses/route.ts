import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const unitId = searchParams.get('unitId')
  if (!unitId) return NextResponse.json({ address: null })

  const { data: cached } = await supabase
    .from('unit_addresses')
    .select('address')
    .eq('unit_id', unitId)
    .maybeSingle()

  if (cached) return NextResponse.json({ address: cached.address })

  const res = await fetch(
    `https://api.buildium.com/v1/rentals/units/${unitId}`,
    {
      headers: {
        'x-buildium-client-id': process.env.BUILDIUM_CLIENT_ID!,
        'x-buildium-client-secret': process.env.BUILDIUM_CLIENT_SECRET!,
      },
    }
  )
  if (!res.ok) return NextResponse.json({ address: null })
  const data = await res.json()
  const addr = data.Address
  if (!addr) return NextResponse.json({ address: null })
  const address = `${addr.AddressLine1}, ${addr.City}, ${addr.State}`
  await supabase.from('unit_addresses').insert({ unit_id: unitId, address })
  return NextResponse.json({ address })
}
