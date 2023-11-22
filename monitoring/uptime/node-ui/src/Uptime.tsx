import { useState } from 'react'
import { useEnvVars } from './providers/EnvVarsProvider'

export interface UptimeResponse {
  host: string
  uptime_percentage: number
  duration: string
  uptime_raw_data: Record<string, number>
}

const Uptime = () => {
  const { endpoint } = useEnvVars()
  const [targetEndpoint, setTargetEndpoint] = useState(endpoint)
  const [uptimeData, setUptimeData] = useState<UptimeResponse | null>(null)

  const fetchUptimeData = async () => {
    try {
      const response = await fetch(
        `${endpoint}/d_api/uptime?host=${targetEndpoint}`
      )
      if (response.ok) {
        const data = (await response.json()) as UptimeResponse
        setUptimeData(data)
      } else {
        console.error('Failed to fetch uptime data')
      }
    } catch (error) {
      console.error('There was an error fetching the uptime data:', error)
    }
  }

  return (
    <>
      <div class="flex justify-between">
        <div class="flex-initial w-3/4">
          <input
            class="w-full"
            type='text'
            value={targetEndpoint}
            onChange={(e) => setTargetEndpoint(e.target.value)}
          />
        </div>
        <div class="flex-none">
          <button 
            class="btn-outline"
            onClick={() => void fetchUptimeData()}
          >
            Check Uptime
          </button>
        </div>
      </div>
      {uptimeData && (
        <>
          <h2>Uptime Data for {uptimeData.host}</h2>
          <p>Overall Uptime: {uptimeData.uptime_percentage}%</p>
          <p>Duration: {uptimeData.duration}</p>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(uptimeData.uptime_raw_data).map(
                ([time, status]) => (
                  <tr key={time}>
                    <td>{time}</td>
                    <td>{status ? 'Up' : 'Down'}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}

export default Uptime
