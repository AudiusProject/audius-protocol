import { useQuery } from '@tanstack/react-query'
import { fetchUrl } from './query'
import { SP, useServiceProviders } from './useServiceProviders'
import { useEnvironmentSelection } from './components/EnvironmentSelector'
import { RelTime } from './misc'

export function Mediorum() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, 'content-node')

  return (
    <div style={{ padding: 30 }}>
      <table className="table">
        <thead>
          <tr>
            <th>host</th>
            <th>ver</th>
            <th>built at</th>
            <th>started at</th>
            <th># uploads</th>
            <th># peers</th>
          </tr>
        </thead>
        <tbody>
          {sps?.map((sp) => (
            <MediorumRow sp={sp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
export function MediorumRow({ sp }: { sp: SP }) {
  const { data: healthCheckData } = useQuery(
    [sp.endpoint + '/health_check'],
    fetchUrl
  )
  const deets = healthCheckData?.data
  const { data: metrics } = useQuery(
    [sp.endpoint + '/internal/metrics'],
    fetchUrl
  )

  // Calculate healthy peers counts
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
  let healthyPeers2m = 0
  let healthyPeers5m = 0
  let unhealthyPeers = 0
  if (deets?.peerHealths) {
    for (const endpoint of Object.keys(deets.peerHealths)) {
      const healthDate = new Date(deets.peerHealths[endpoint])
      if (isNaN(healthDate.getTime()) || healthDate <= fiveMinutesAgo) {
        // Peer is unhealthy if healthDate is NaN or if it's more than 5 minutes ago
        unhealthyPeers++
      } else if (healthDate <= twoMinutesAgo) {
        healthyPeers5m++
      } else {
        healthyPeers2m++
      }
    }
  }

  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint}
        </a>
      </td>
      <td>{deets?.version}</td>
      <td>{deets?.builtAt}</td>
      <td>
        <RelTime date={deets?.startedAt} />
      </td>
      <td>{metrics?.uploads}</td>
      <td>
        <b>{healthyPeers2m}</b> healthy {'<'}2m ago, <b>{healthyPeers5m}</b>{' '}
        healthy {'<'}5m ago, <b>{unhealthyPeers}</b> unhealthy
      </td>
    </tr>
  )
}
