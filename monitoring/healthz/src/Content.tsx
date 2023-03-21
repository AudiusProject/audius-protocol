import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { HealthLink } from './misc'
import { fetchHealth } from './query'

const sortDescKey = 'sortDesc'

export function ContentHealth() {
  let [searchParams, setSearchParams] = useSearchParams()

  const type = 'content-node'
  const env = 'prod'

  let { data } = useQuery([env, type], fetchHealth)

  if (!data) return <div>loading</div>

  const sortField = searchParams.get('sort') // e.g. 'discoveryHealth.data.block_difference'
  const sortDesc = searchParams.get(sortDescKey) == '1'
  if (sortField) {
    data.sort((a, b) => {
      let ax = tryGet(a, sortField)
      let bx = tryGet(b, sortField)
      if (bx == undefined) return -1
      if (ax == undefined) return 1
      if (sortField.includes('endpoint')) {
        ax = ax.split('.').reverse().join('.')
        bx = bx.split('.').reverse().join('.')
      }
      const result = ax < bx ? -1 : 1
      return sortDesc ? result * -1 : result
    })
  }

  function setSort(field: string) {
    if (field == sortField) {
      setSearchParams((p) => {
        p.get(sortDescKey) ? p.delete(sortDescKey) : p.set(sortDescKey, '1')
        return p
      })
    } else {
      setSearchParams((p) => {
        p.set('sort', field)
        p.delete(sortDescKey)
        return p
      })
    }
  }

  return (
    <div>
      <h1>WIP Content Health</h1>
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => setSort('endpoint')}>host</th>
            <th onClick={() => setSort('health.data.version')}>ver</th>
            <th onClick={() => setSort('health.data.version')}>sha</th>
            <th onClick={() => setSort('health.data.spID')}>id</th>
            <th onClick={() => setSort('health.timestamp')}>as of</th>
            <th
              onClick={() => setSort('health.data.selectedDiscoveryProvider')}
            >
              discovery host
            </th>
            <th
              onClick={() => setSort('discoveryHealth.data.block_difference')}
            >
              blockdiff
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.endpoint}>
              <td>
                <HealthLink endpoint={d.endpoint} />
              </td>
              <td>{d.health?.data.version}</td>
              <td>
                <a
                  href={`https://github.com/AudiusProject/audius-protocol/commits/${d.health?.data.git}`}
                  target="_blank"
                >
                  {d.health?.data.git.substring(0, 8)}
                </a>
              </td>
              <td>{d.health?.data.spID}</td>
              <td>{d.health?.timestamp}</td>
              <td>
                <HealthLink
                  endpoint={d.health?.data.selectedDiscoveryProvider}
                />
              </td>
              <td>{d.discoveryHealth?.data.block_difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function tryGet(obj: any, path: string, fallback?: any) {
  try {
    return eval('obj.' + path)
  } catch {
    return fallback
  }
}
