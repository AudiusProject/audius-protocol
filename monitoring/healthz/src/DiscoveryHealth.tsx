import useSWR from 'swr'
import {
  EnvironmentSelector,
  useEnvironmentSelection,
} from './components/EnvironmentSelector'
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
      <table className="table">
        <thead>
          <tr>
            <th>Host</th>
            <th>Block Diff</th>
            <th>Registered</th>
            <th>Ver</th>
            <th>Git SHA</th>
            <th>Compose</th>
            <th>Auto Upgrade</th>
            {isContent && <th>selectedDiscoveryProvider</th>}
            <th>Storage</th>
            <th>DB Size</th>
            <th>ACDC Signer Health</th>
            <th>Is Signer</th>
            <th>Peers</th>
            <th>Producing</th>
            <th>ACDC Block</th>
            <th>ACDC Block Hash</th>
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
  const composeSha =
    health['audius-docker-compose'] || health['audiusDockerCompose']
  const fsUsed =
    bytesToGb(health.filesystem_used) || bytesToGb(health.storagePathUsed)
  const fsSize =
    bytesToGb(health.filesystem_size) || bytesToGb(health.storagePathSize)
  const storagePercent = fsUsed / fsSize
  const isBehind = health.block_difference > 5 ? 'is-behind' : ''
  const dbSize =
    bytesToGb(health.database_size) || bytesToGb(health.databaseSize)
  const autoUpgradeEnabled =
    health.auto_upgrade_enabled || health.autoUpgradeEnabled
  const getPeers = (str: string | undefined) => {
    if (str === undefined) return "chain health undefined"
    const match = str.match(/Peers: (\d+)\./)
    return (match && match[1]) ? match[1] : "no peers found"
  }
  const getProducing = (str: string | undefined) => {
    if (str === undefined) return "chain health undefined"
    return (!str.includes("The node stopped producing blocks.")).toString()
  }
  // currently discprov does not expose the address of its internal chain instance
  const isSigner = (str: string | undefined) => getProducing(str)
  const chainDescription: string = health.chain_health?.entries["node-health"].description

  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td className={isBehind}>{health.block_difference}</td>
      <td>{sp.isRegistered.toString()}</td>
      <td>{health.version}</td>
      <td>
        <a
          href={`https://github.com/AudiusProject/audius-protocol/commits/${health.git}`}
          target="_blank"
        >
          {health.git.substring(0, 8)}
        </a>
      </td>
      <td>
        {isCompose && '✓'}{' '}
        {composeSha && (
          <a
            href={`https://github.com/AudiusProject/audius-docker-compose/commits/${composeSha}`}
            target="_blank"
          >
            {composeSha.substring(0, 8)}
          </a>
        )}
      </td>
      <td>{autoUpgradeEnabled && '✓'}</td>
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
        <span>
          {fsUsed} / {fsSize} GB
        </span>
      </td>
      <td>{`${dbSize} GB`}</td>
      <td>{health.chain_health?.status}</td>
      <td>{isSigner(chainDescription)}</td>
      <td>{getPeers(chainDescription)}</td>
      <td>{getProducing(chainDescription)}</td>
      <td>{health.chain_health?.block_number}</td>
      <td>{health.chain_health?.hash}</td>
    </tr>
  )
}
