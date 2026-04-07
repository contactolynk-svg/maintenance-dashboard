const BASE_URL = 'https://api.buildium.com/v1'

const headers = {
  'x-buildium-client-id': process.env.BUILDIUM_CLIENT_ID!,
  'x-buildium-client-secret': process.env.BUILDIUM_CLIENT_SECRET!,
  'Content-Type': 'application/json',
}

export async function getWorkOrders() {
  const res = await fetch(`${BASE_URL}/tasks/workordertasks?statuses=New,InProgress`, {
    headers,
    next: { revalidate: 300 }
  })
  if (!res.ok) throw new Error('Failed to fetch work orders from Buildium')
  return res.json()
}

export async function getWorkOrderById(id: string) {
  const res = await fetch(`${BASE_URL}/tasks/workordertasks/${id}`, {
    headers,
    next: { revalidate: 60 }
  })
  if (!res.ok) throw new Error(`Failed to fetch work order ${id}`)
  return res.json()
}
