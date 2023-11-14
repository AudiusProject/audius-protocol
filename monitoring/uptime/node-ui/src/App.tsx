import { useState } from 'react'
import { useEnvVars } from './providers/EnvVarsProvider'
import { useAudiusLibs } from './providers/AudiusLibsProvider'

interface UptimeResponse {
  host: string
  uptime_percentage: number
  duration: string
  uptime_raw_data: Record<string, number>
}

const App = () => {
  const { endpoint, env, nodeType } = useEnvVars()
  const { audiusLibs, isLoading: isAudiusLibsLoading } = useAudiusLibs()
  const [targetEndpoint, setTargetEndpoint] = useState(endpoint)
  const [uptimeData, setUptimeData] = useState<UptimeResponse | null>(null)

  const fetchUptimeData = async () => {
    try {
      const response = await fetch(
        `${endpoint}/up_api/uptime?host=${targetEndpoint}`
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
      <h1>Uptime UI</h1>
      <p>Host: {endpoint}</p>
      <p>Environment: {env}</p>
      <p>Node Type: {nodeType}</p>
      <p>
        Libs: {isAudiusLibsLoading ? 'loading...' : `v${audiusLibs!.version}`}
      </p>
      <input
        type='text'
        value={targetEndpoint}
        onChange={(e) => setTargetEndpoint(e.target.value)}
      />
      <button onClick={() => void fetchUptimeData()}>Check Uptime</button>
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

export default App
