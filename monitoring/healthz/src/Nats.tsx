import { useQuery } from '@tanstack/react-query'
import {
  EnvironmentSlector,
  useEnvironmentSelection,
} from './components/EnvironmentSlector'
import { fetchSPs, fetchUrl } from './query'
import { SP, useServiceProviders } from './useServiceProviders'

export function Nats() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps } = useQuery([env, nodeType], fetchSPs)

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
            <th>exchange peers</th>
            <th>NATS uptime</th>
            <th>NATS routes</th>
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
  const { data: peers } = useQuery([`${sp.endpoint}/nats/peers`], fetchUrl)
  const { data: varz } = useQuery([`${sp.endpoint}/nats/varz`], fetchUrl)
  const { data: routez } = useQuery([`${sp.endpoint}/nats/routez`], fetchUrl)

  return (
    <tr>
      <td>
        <a href={`${sp.endpoint}/nats`} target="_blank">
          {sp.endpoint}
        </a>
      </td>
      <td>{peers?.length}</td>
      <td>{varz?.uptime}</td>
      <td>{routez?.num_routes}</td>
    </tr>
  )
}
