import useSWR from 'swr'
import {
  EnvironmentSlector,
  useEnvironmentSelection,
} from './components/EnvironmentSlector'
import { SP, useServiceProviders } from './useServiceProviders'

const bytesToGb = (bytes: number) => Math.floor(bytes / 10 ** 9)
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
            <th>git sha</th>
            <th>compose?</th>
            <th>auto upgrade</th>
            {isContent && <th>selectedDiscoveryProvider</th>}
            <th>storage</th>
            <th>dbsize</th>
            <th>blockdiff</th>
            <th>chain</th>
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

  const health = data?.data

  if (!health)
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

  const isCompose = health.infra_setup || health.audiusContentInfraSetup
  const fsUsed = bytesToGb(health.filesystem_used) || bytesToGb(health.storagePathUsed)
  const fsSize = bytesToGb(health.filesystem_size) || bytesToGb(health.storagePathSize)
  const storagePercent = fsUsed / fsSize
  const isBehind = health.block_difference > 5 ? 'is-behind' : ''
  const dbSize = bytesToGb(health.database_size) || bytesToGb(health.databaseSize)
  const autoUpgradeEnabled =
    health.auto_upgrade_enabled || health.autoUpgradeEnabled

  return (
    <tr className={isBehind}>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td>{health.version}</td>
      <td>
        <a
          href={`https://github.com/AudiusProject/audius-protocol/commits/${health.git}`}
          target="_blank"
        >
          {health.git.substring(0, 8)}
        </a>
      </td>
      <td>{isCompose && 'Yes'}</td>
      <td>{autoUpgradeEnabled && 'Yes'}</td>
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
      <td>
        <progress value={storagePercent} />
        <br></br>
        <span>{fsUsed} / {fsSize} GB</span>
      </td>
      <td>{`${dbSize} GB`}</td>
      <td>{health.block_difference}</td>
      <td>{health.chain_health?.status}</td>
    </tr>
  )
}
