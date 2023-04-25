import useSWR from 'swr'
import { JsonToTable } from 'react-json-to-table'

import { SP } from './useServiceProviders'
import { useEnvironmentSelection } from './components/EnvironmentSelector'
import { useServiceProviders } from './useServiceProviders'

const convertBooleansToStrings = (obj: any) => {
  const res = { ...obj }
  for (const key in obj) {
    if (typeof obj[key] === 'boolean') {
      res[key] = obj[key].toString()
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      res[key] = convertBooleansToStrings(obj[key])
    }
  }
  return res
}

export function DiscoveryPlugins() {
  const [env] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, 'discovery-node')
  if (error) return <div>error</div>
  if (!sps) return null
  return (
    <div style={{ padding: 20 }}>
      <h2>{'Plugins'}</h2>
      <table className="table">
        <tbody>
          {sps.map((sp) => (
            <PluginRow key={sp.endpoint} sp={sp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then(convertBooleansToStrings)

function PluginRow({ sp }: { sp: SP }) {
  const { data, error } = useSWR(sp.endpoint + '/plugins', fetcher)

  if (!data || error || data.error) return null

  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <JsonToTable json={data} />
      </td>
    </tr>
  )
}
