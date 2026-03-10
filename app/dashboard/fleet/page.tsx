import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import FleetClient from './fleetClient'
import { getFleetData } from './actions'
import type { DriverRow, VehicleOption } from '@/utils/types' // réutilise tes types

export default async function FleetPage() {
  const session = await getSession()
  if (!session?.companyId) redirect('/login')

  const { drivers, vehicles } = await getFleetData()

  return (
    <FleetClient
      initialDrivers={drivers}
      initialVehicles={vehicles}
    />
  )
}