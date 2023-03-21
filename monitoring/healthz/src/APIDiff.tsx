import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchApi, fetchHealth } from './query'
import { SP } from './useServiceProviders'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer'
import { HealthLink } from './misc'
import {
  EnvironmentSlector,
  useEnvironmentSelection,
} from './components/EnvironmentSlector'

export function APIDiff() {
  let [searchParams, setSearchParams] = useSearchParams()

  const [env, type] = useEnvironmentSelection()

  const path =
    searchParams.get('path') ||
    '/v1/full/users/handle/stereosteve?user_id=aNzoj'

  let { data } = useQuery([env, type, path], fetchApi)

  if (!data) return <div>loading</div>

  const grouped = groupBy(data, 'apiJson') as Record<string, SP[]>
  const sortedGroups = Object.entries(grouped)
  sortedGroups.sort((a, b) => (a[1].length > b[1].length ? -1 : 1))
  const winner = sortedGroups[0]

  function setPath(val: string) {
    try {
      const u = new URL(val)
      val = u.pathname
    } catch (e) {}
    setSearchParams((was) => {
      was.set('path', val)
      return was
    })
  }

  return (
    <div>
      <div style={{ padding: 10, background: '#efefef', marginBottom: 10 }}>
        <EnvironmentSlector />

        <input
          value={path}
          style={{ width: '100%', padding: 8 }}
          onChange={(e) => setPath(e.target.value)}
        />
      </div>

      {sortedGroups.length == 1 && (
        <div>
          <h1>100% Agreement</h1>
          <pre style={{ fontSize: 14 }}>{winner[0]}</pre>
        </div>
      )}

      {sortedGroups.slice(1).map(([json, sps]) => (
        <div key={json} style={{ margin: 10, border: '3px solid gray' }}>
          <div
            style={{
              fontWeight: 'bold',
              padding: 6,
              fontSize: 18,
              background: 'black',
              color: 'orange',
            }}
          >
            {winner[1].length} vs {sps.length}
          </div>

          <ul>
            {sps.map((sp) => (
              <li key={sp.endpoint}>
                <HealthLink endpoint={sp.endpoint} />
              </li>
            ))}
          </ul>

          <ReactDiffViewer
            oldValue={winner[0]}
            newValue={json}
            splitView={true}
            compareMethod={DiffMethod.WORDS}
          />
        </div>
      ))}
    </div>
  )
}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
var groupBy = function (xs: any, key: any) {
  if (!xs) return
  return xs.reduce(function (rv: any, x: any) {
    ;(rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}
