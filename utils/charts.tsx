import { useMemo } from "react"
import { DeliveryFromServer } from "./types"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'


export function DriverCharts({ deliveriesForDriver }: { deliveriesForDriver: DeliveryFromServer[] }){

    const chartDataByMonth = useMemo(() => {
        const byMonth = new Map<string, { month: string; livraisons: number; score: number }>()
        const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        for (let i = 5; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          byMonth.set(key, { month: monthNames[d.getMonth()], livraisons: 0, score: 0 })
        }
        deliveriesForDriver.forEach((d) => {
          const dt = typeof d.createdAt === 'string' ? new Date(d.createdAt) : d.createdAt
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
          if (byMonth.has(key)) {
            const entry = byMonth.get(key)!
            entry.livraisons += 1
            entry.score = Math.round((entry.score * (entry.livraisons - 1) + (d.status === 'COMPLETED' ? 96 : d.status === 'DELAYED' ? 72 : 85)) / entry.livraisons)
          }
        })
        return Array.from(byMonth.values())
      }, [deliveriesForDriver])

      return (
        <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" style={{ fontSize: '10px' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '10px' }} yAxisId="left" />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '10px' }} yAxisId="right" orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }} labelStyle={{ color: 'var(--text-main)' }} />
                  <Line yAxisId="left" type="monotone" dataKey="livraisons" name="Livraisons" stroke="#13ec5b" strokeWidth={3} dot={{ fill: '#13ec5b', r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="score" name="Score moyen" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#6366f1', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
         </div>
    )
} 

