import { useEffect, useState } from 'react'
import {
  EnvironmentSelector,
  useEnvironmentSelection,
} from './components/EnvironmentSelector'
import { useServiceProviders } from './useServiceProviders'
import useSWR from 'swr'
import { fetcher } from './query'

export function DMMatrix() {
  const [env, nodeType] = useEnvironmentSelection()
  const [since, setSince] = useState('2023-05-25')
  const { data: sps, error } = useServiceProviders(env, nodeType)
  const [m, setM] = useState<
    Record<string, Record<string, { count: number; relayed_at: string }>>
  >({})
  const [hoverCol, setHoverCol] = useState(-1)

  useEffect(() => {
    setM({})
  }, [env])

  useEffect(() => {
    sps?.map(async (sp) => {
      const sinceParam = encodeURIComponent(new Date(since).toISOString())
      const resp = await fetch(
        sp.endpoint + `/comms/debug/cursors?since=${sinceParam}`
      )
      const data = await resp.json()
      const inner: any = {}
      for (let peer of data) {
        inner[peer.relayed_by] = peer
      }
      setM((m) => ({ ...m, [sp.endpoint]: inner }))
    })
  }, [sps, since])

  const hosts = Object.keys(m)
  const hostSortKey = (host: string) =>
    new URL(host).hostname.split('.').reverse().join('.')
  hosts.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))

  return (
    <div>
      <input
        type="date"
        value={since}
        onChange={(e) => setSince(e.target.value)}
      />

      <table className="table">
        <thead>
          <tr>
            <td></td>
            <td className="spun">
              <span>blockdiff</span>
            </td>
            {hosts.map((host, idx) => (
              <td
                className="spun"
                key={host}
                style={{ background: idx == hoverCol ? 'lightyellow' : '' }}
              >
                <span>{host.replace('https://', '')}</span>
              </td>
            ))}
          </tr>
        </thead>
        <tbody onMouseLeave={() => setHoverCol(-1)}>
          {hosts.map((host, hostIdx) => (
            <tr key={host}>
              <td>{host.replace('https://', '')}</td>
              <HealthCell host={host} />
              {hosts.map((other, idx) => (
                <td
                  className="matrix-cell"
                  style={{
                    background:
                      idx == hostIdx
                        ? 'grey'
                        : idx == hoverCol
                        ? 'lightyellow'
                        : '',
                  }}
                  key={other}
                  onMouseEnter={() => setHoverCol(idx)}
                >
                  {m[host][other]?.count ? (
                    <span title={m[host][other].relayed_at}>
                      {m[host][other].count}
                    </span>
                  ) : (
                    ''
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HealthCell({ host }: { host: string }) {
  const { data, error } = useSWR(host + '/health_check', fetcher)
  const health = data?.data
  if (error) return <td>error</td>
  if (!health) return <td>...</td>

  return <td>{health.block_difference}</td>
}
