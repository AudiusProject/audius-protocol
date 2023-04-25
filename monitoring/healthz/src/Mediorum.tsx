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
  const { data: deets } = useQuery(
    [sp.endpoint + '/mediorum/internal/health'],
    fetchUrl
  )
  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/mediorum/internal/health'} target="_blank">
          {sp.endpoint}
        </a>
      </td>
      <td>{deets?.version}</td>
      <td>{deets?.built_at}</td>
      <td>
        <RelTime date={deets?.started_at} />
      </td>
    </tr>
  )
}
