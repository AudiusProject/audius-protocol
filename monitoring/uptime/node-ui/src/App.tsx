import { useState } from 'react'
import { useBlockNumber, useNetwork } from 'wagmi'
import { useEnvVars } from './providers/EnvVarsProvider'
import { useAudiusLibs } from './providers/AudiusLibsProvider'
import useMinChainVersions from './hooks/useMinChainVersions'
import useLatestGitHubVersions from './hooks/useLatestGitHubVersions'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

interface UptimeResponse {
  host: string
  uptime_percentage: number
  duration: string
  uptime_raw_data: Record<string, number>
}

const App = () => {
  const { endpoint, env, nodeType } = useEnvVars()
  const {
    audiusLibs,
    isLoading: isAudiusLibsLoading,
    isReadOnly: isLibsReadOnly
  } = useAudiusLibs()
  const [targetEndpoint, setTargetEndpoint] = useState(endpoint)
  const [uptimeData, setUptimeData] = useState<UptimeResponse | null>(null)

  const {
    data: minChainVersions,
    isPending: isMinChainVersionsPending,
    error: minChainVersionsError
  } = useMinChainVersions()
  const {
    data: latestGithubVersions,
    isPending: isLatestGithubVersionsPending,
    error: latestGithubVersionsError
  } = useLatestGitHubVersions()

  const { chain, chains } = useNetwork()
  const { data: latestBlockNumber } = useBlockNumber({
    chainId: 1
  })

  const fetchUptimeData = async () => {
    try {
      const response = await fetch(
        `${endpoint}/d_api/dtime?host=${targetEndpoint}`
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
        Min enforceable versions (chain):{' '}
        {isMinChainVersionsPending
          ? 'loading...'
          : minChainVersionsError
          ? 'error'
          : JSON.stringify(minChainVersions)}
      </p>
      <p>
        Latest versions (GitHub):{' '}
        {isLatestGithubVersionsPending
          ? 'loading...'
          : latestGithubVersionsError
          ? 'error'
          : JSON.stringify(latestGithubVersions)}
      </p>

      <br />

      <p>
        Latest block: {(latestBlockNumber ?? '').toString()} (
        {chain?.name || 'unknown chain'})
      </p>
      <p>Available chains: {chains.map((chain) => chain.name).join(', ')}</p>
      <p>
        Libs:{' '}
        {isAudiusLibsLoading
          ? 'loading...'
          : `v${audiusLibs!.version} (${
              isLibsReadOnly ? 'read-only' : 'able to sign txns'
            })`}
      </p>
      <div>
        <ConnectButton />
      </div>
      <br />
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
