import { requireAuth } from '@/lib/auth'
import FleetClient from './fleetClient'
import { getFleetData } from './actions'
import type { DriverRow, VehicleOption } from '@/utils/types' // réutilise tes types

export default async function FleetPage() {
  const session = await requireAuth()

  const { drivers, vehicles } = await getFleetData()

  return (
    <FleetClient
      initialDrivers={drivers}
      initialVehicles={vehicles}
    />
  )
}