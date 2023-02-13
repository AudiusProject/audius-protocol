import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  EnvironmentSlector,
  useEnvironmentSelection,
} from './components/EnvironmentSlector'
import { fetchSPs, fetchUrl } from './query'
import { SP, useServiceProviders } from './useServiceProviders'

export function Nats() {
  const [env, nodeType] = useEnvironmentSelection()
  let { data: sps } = useQuery([env, nodeType], fetchSPs)

  if (!sps) return null

  return (
    <div>
      <EnvironmentSlector />
      <h1>
        {env} {nodeType}
      </h1>
      <table className="table">
        <thead>
          <tr>
            <th>endpoint</th>
            <th>wallet</th>
            <th>ver</th>
            <th>exchange peers</th>
            <th>nats reachable</th>
            <th>NATS uptime</th>
            <th>NATS routes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sps.map((sp) => (
            <NatsRow key={sp.endpoint} sp={sp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NatsRow({ sp }: { sp: SP }) {
  const { data: health } = useQuery([`${sp.endpoint}/health_check`], fetchUrl)
  const { data: peers } = useQuery([`${sp.endpoint}/nats/peers`], fetchUrl)
  const { data: varz } = useQuery([`${sp.endpoint}/nats/varz`], fetchUrl)
  const { data: routez } = useQuery([`${sp.endpoint}/nats/routez`], fetchUrl)
  const isJetstreamLeader =
    varz && varz.server_name && varz.server_name == varz.jetstream?.meta?.leader

  const sidecarRoute = sp.type.id == 'content-node' ? `/storage` : `/comms`
  const { data: sidecarStatus } = useQuery(
    [sp.endpoint, sidecarRoute],
    async () => {
      try {
        const resp = await fetch(sp.endpoint + sidecarRoute)
        return resp.status
      } catch (e: any) {
        console.log(e.message)
        return e.message
      }
    }
  )

  const me = useMemo(
    () => Array.isArray(peers) && peers.find((p: any) => p.IsSelf),
    [peers]
  )

  return (
    <tr>
      <td>
        <a href={`${sp.endpoint}/nats`} target="_blank">
          {sp.endpoint}
        </a>
      </td>
      <td>
        <pre style={{ fontSize: '60%' }}>{health?.signer}</pre>
      </td>
      <td>{health?.data && <div>{health.data.version}</div>}</td>
      <td>{peers && peers.length}</td>
      <td>
        {me?.NatsIsReachable ? '✓' : ''}
        {isJetstreamLeader && (
          <span style={{ fontSize: '60%' }}>jetstream leader</span>
        )}
      </td>
      <td>{varz?.uptime}</td>
      <td>{routez?.num_routes}</td>
      <td>
        <a href={`${sp.endpoint}${sidecarRoute}`} target="_blank">
          {sidecarRoute}
        </a>
        {` `}
        <b style={{ color: sidecarStatus == 200 ? 'darkgreen' : 'red' }}>
          {sidecarStatus}
        </b>
      </td>
    </tr>
  )
}
