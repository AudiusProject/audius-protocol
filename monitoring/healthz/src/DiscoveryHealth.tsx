import useSWR from 'swr'
import {
  EnvironmentSlector,
  useEnvironmentSelection,
} from './components/EnvironmentSlector'
import { SP, useServiceProviders } from './useServiceProviders'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DiscoveryHealth() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, nodeType)

  const isContent = nodeType == 'content-node'

  if (error) return <div>error</div>
  if (!sps) return null
  return (
    <div style={{ padding: 20 }}>
      <EnvironmentSlector />

      <table className="table">
        <thead>
          <tr>
            <th>host</th>
            <th>ver</th>
            <th>compose?</th>
            <th>git sha</th>
            {isContent && <th>selectedDiscoveryProvider</th>}
            <th>blockdiff</th>
          </tr>
        </thead>
        <tbody>
          {sps.map((sp) => (
            <HealthRow key={sp.endpoint} isContent={isContent} sp={sp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HealthRow({ isContent, sp }: { isContent: boolean; sp: SP }) {
  const { data, error } = useSWR(sp.endpoint + '/health_check', fetcher)

  if (!data)
    return (
      <tr>
        <td>
          <a href={sp.endpoint + '/health_check'} target="_blank">
            {sp.endpoint.replace('https://', '')}
          </a>
        </td>
        <td>{error ? 'error' : 'loading'}</td>
      </tr>
    )

  const health = data.data
  const isCompose = health.infra_setup || health.audiusContentInfraSetup

  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td>{health.version}</td>
      <td>{isCompose && 'Yes'}</td>
      <td>
        <a
          href={`https://github.com/AudiusProject/audius-protocol/commits/${health.git}`}
          target="_blank"
        >
          {health.git.substring(0, 8)}
        </a>
      </td>
      {isContent && (
        <td>
          <a
            href={`${health.selectedDiscoveryProvider}/health_check`}
            target="_blank"
          >
            {health.selectedDiscoveryProvider}
          </a>
        </td>
      )}
      <td>{health.block_difference}</td>
    </tr>
  )
}
