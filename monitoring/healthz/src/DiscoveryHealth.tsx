import useSWR from 'swr'
import {
  useEnvironmentSelection,
} from './components/EnvironmentSelector'
import { SP, useServiceProviders } from './useServiceProviders'
import { RelTime, timeSince, nanosToReadableDuration } from './misc'
import './DiscoveryHealth.css'

const bytesToGb = (bytes: number) => Math.floor(bytes / 10 ** 9)
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DiscoveryHealth() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, nodeType)

  const isContent = nodeType == 'content-node'
  const isDiscovery = nodeType == 'discovery-node'

  if (error) return <div>error</div>
  if (!sps) return null
  return (
    <div style={{ padding: 20 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Host</th>
            {isDiscovery && <th>Block Diff</th>}
            <th>Registered</th>
            <th>Ver</th>
            <th>Git SHA</th>
            <th>Compose</th>
            <th>Auto Upgrade</th>
            {isContent && <th>Backend</th>}
            {isDiscovery && <th>Storage</th>}
            {isContent && <th>Storage (legacy)</th>}
            {isContent && <th>Storage (mediorum)</th>}
            {isContent && <th>Last Non-Cleanup Repair</th>}
            {isContent && <th>Last Cleanup</th>}
            {isContent && <th>Cleanup (checked, pulled, deleted)</th>}
            {isContent && <th>/file_storage</th>}
            {isContent && <th>/tmp/mediorum</th>}
            <th>Relay</th>
            <th>DB Size</th>
            <th>Your IP</th>
            {isDiscovery && <th>ACDC Health</th>}
            {isDiscovery && <th>Is Signer</th>}
            {isDiscovery && <th>Peers</th>}
            {isDiscovery && <th>Producing</th>}
            {isDiscovery && <th>ACDC Block</th>}
            {isDiscovery && <th>ACDC Block Hash</th>}
            {isContent && <th>Started</th>}
            {isContent && <th>Uploads</th>}
            {isContent && <th>Healthy Peers {'<'}2m</th>}
            <th>Registered Wallet</th>
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
  // TODO(michelle): after all nodes updated, change this to
  // const path = isContent ? '/health_check' : '/health_check?verbose=true&enforce_block_diff=true&healthy_block_diff=250&plays_count_max_drift=720'
  const path = isContent ? '/health_check' : '/health_check?enforce_block_diff=true&healthy_block_diff=250'
  const relayPath = '/relay/health'
  const { data, error } = useSWR(sp.endpoint + path, fetcher)
  const { data: relayHealth, error: relayHealthError } = useSWR(sp.endpoint + relayPath, fetcher)
  const { data: ipCheck, error: ipCheckError } = useSWR(
    sp.endpoint + '/ip_check',
    fetcher
  )
  const { data: metrics } = useSWR(sp.endpoint + '/internal/metrics', fetcher)

  const health = data?.data
  const yourIp = ipCheck?.data
  const relayStatus = relayHealth?.status

  if (!health || !yourIp)
    return (
      <tr>
        <td>
          <a href={sp.endpoint + path} target="_blank">
            {sp.endpoint.replace('https://', '')}
          </a>
        </td>
        <td>{error || ipCheckError ? 'error' : 'loading'}</td>
      </tr>
    )

  // calculate healthy peers counts
  const now = new Date()
  const twoMinutesAgoDate = new Date(now.getTime() - 2 * 60 * 1000)
  let healthyPeers2m = 0
  if (health?.peerHealths) {
    for (const endpoint of Object.keys(health.peerHealths)) {
      const peerHealth = health.peerHealths[endpoint]
      const healthDate = new Date(peerHealth?.lastHealthy)
      if (!isNaN(healthDate.getTime()) && healthDate > twoMinutesAgoDate) {
        healthyPeers2m++
      }
    }
  }

  // TODO(michelle) after all nodes updated, change DN check to health.discovery_node_healthy
  const isHealthy = isContent ? health.healthy : !health.errors || (Array.isArray(health.errors) && health.errors.length === 0)
  const unreachablePeers = health.unreachablePeers?.join(', ')

  const isCompose = health.infra_setup || health.audiusContentInfraSetup
  const composeSha =
    health['audius-docker-compose'] || health['audiusDockerCompose']
  const fsUsed =
    bytesToGb(health.filesystem_used) || bytesToGb(health.storagePathUsed)
  const fsSize =
    bytesToGb(health.filesystem_size) || bytesToGb(health.storagePathSize)
  const storagePercent = fsUsed / fsSize
  const mediorumUsed = bytesToGb(health.mediorumPathUsed)
  const mediorumSize = bytesToGb(health.mediorumPathSize)
  const mediorumPercent = mediorumUsed / mediorumSize
  const legacyDirUsed = bytesToGb(health.legacyDirUsed)
  const mediorumDirUsed = bytesToGb(health.mediorumDirUsed)
  const isBehind = health.block_difference > 5 ? 'is-unhealthy' : ''
  const dbSize =
    bytesToGb(health.database_size) || bytesToGb(health.databaseSize)
  const autoUpgradeEnabled =
    health.auto_upgrade_enabled || health.autoUpgradeEnabled
  const getPeers = (str: string | undefined) => {
    if (str === undefined) return 'chain health undefined'
    const match = str.match(/Peers: (\d+)\./)
    return match && match[1] ? match[1] : 'no peers found'
  }
  const getProducing = (str: string | undefined) => {
    if (str === undefined) return 'chain health undefined'
    return (!str.includes('The node stopped producing blocks.')).toString()
  }
  // currently discprov does not expose the address of its internal chain instance
  const isSigner = (nodeAddr?: string, signerAddrs?: string[]) => {
    if (nodeAddr === undefined) return 'node address not found'
    if (signerAddrs === undefined) return 'clique signers not found'
    return signerAddrs.includes(nodeAddr.toLowerCase()).toString()
  }
  const chainDescription: string =
    health.chain_health?.entries['node-health'].description

  return (
    <tr className={isHealthy ? '' : 'is-unhealthy'}>
      <td>
        <a href={sp.endpoint + path} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      {!isContent && <td className={isBehind}>{health.block_difference}</td>}
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
        <td>{health.blobStorePrefix}</td>
      )}
      <td>
        <progress value={storagePercent} />
        <br></br>
        <span>
          {fsUsed} / {fsSize} GB
        </span>
      </td>
      {isContent && (
        <td>
          <progress value={mediorumPercent} />
          <br></br>
          <span>
            {mediorumUsed} / {mediorumSize} GB
          </span>
        </td>
      )}
      {isContent && (
        <td>
          <a href={sp.endpoint + '/internal/logs/repair'} target="_blank">
            {timeSince(health.lastSuccessfulRepair?.FinishedAt) === null
              ? "repairing..."
              : (
                <span>done <RelTime date={new Date(health.lastSuccessfulRepair.FinishedAt)} />{`, took ${nanosToReadableDuration(health.lastSuccessfulRepair.Duration || 0)}, checked ${(health.lastSuccessfulRepair.Counters?.total_checked || 0)} CIDs, ${bytesToGb(health.lastSuccessfulRepair.ContentSize ?? 0)} GB`}</span>)}
          </a>
        </td>
      )}
      {isContent && (
        <td>
          <a href={sp.endpoint + '/internal/logs/repair'} target="_blank">
            {timeSince(health.lastSuccessfulCleanup?.FinishedAt) === null
              ? "repairing..."
              : (
                <span>done <RelTime date={new Date(health.lastSuccessfulCleanup.FinishedAt)} />{`, took ${nanosToReadableDuration(health.lastSuccessfulCleanup?.Duration || 0)}, checked ${bytesToGb(health.lastSuccessfulCleanup.ContentSize ?? 0)} GB`}</span>)}
          </a>
        </td>
      )}
      {isContent && (
        <td>
          <a href={sp.endpoint + '/internal/logs/repair'} target="_blank">
            {timeSince(health.lastSuccessfulCleanup?.FinishedAt) === null
              ? "repairing..."
              : (<span>{`(${health.lastSuccessfulCleanup?.Counters?.total_checked ?? 0}, ${(health.lastSuccessfulCleanup?.Counters?.pull_mine_needed ?? 0) + (health.lastSuccessfulCleanup?.Counters?.pull_under_replicated_needed ?? 0)}, ${health.lastSuccessfulCleanup?.Counters?.delete_over_replicated_needed ?? 0})`}</span>)}
          </a>
        </td>
      )}
      {isContent && (<td>{legacyDirUsed} GB</td>)}
      {isContent && (<td>{mediorumDirUsed} GB</td>)}
      <td>{`${relayStatus || "down" }`}</td>
      <td>{`${dbSize} GB`}</td>
      <td>{`${yourIp}`}</td>
      {!isContent && (<td>{health.chain_health?.status}</td>)}
      {!isContent && <td>{isSigner(data?.signer, health.chain_health?.signers)}</td>}
      {!isContent && <td>{getPeers(chainDescription)}</td>}
      {!isContent && <td>{getProducing(chainDescription)}</td>}
      {!isContent && <td>{health.chain_health?.block_number}</td>}
      {!isContent && (<td>
        <pre>{health.chain_health?.hash}</pre>
      </td>)}
      {isContent && (<td>
        <RelTime date={health?.startedAt} />
      </td>)}
      {isContent && <td>{metrics?.uploads}</td>}
      {isContent && (
        <td className="unreachable-peers">
          {healthyPeers2m}
          {unreachablePeers && <div>{`Can't reach: ${unreachablePeers}`}</div>}
        </td>
      )}
      <td>
        <pre>{sp.delegateOwnerWallet}</pre>
      </td>
    </tr>
  )
}

function truncateToTwoDecimals(x: number) {
  return Math.floor(x * 100) / 100
}
