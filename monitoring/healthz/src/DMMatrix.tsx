import { useEffect, useState } from 'react'
import {
  EnvironmentSelector,
  useEnvironmentSelection,
} from './components/EnvironmentSelector'
import { useServiceProviders } from './useServiceProviders'

export function DMMatrix() {
  const [env, nodeType] = useEnvironmentSelection()
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
      const resp = await fetch(sp.endpoint + `/comms/debug/cursors`)
      const data = await resp.json()
      const inner: any = {}
      for (let peer of data) {
        inner[peer.relayed_by] = peer
      }
      setM((m) => ({ ...m, [sp.endpoint]: inner }))
    })
  }, [sps])

  const hosts = Object.keys(m)
  const hostSortKey = (host: string) =>
    new URL(host).hostname.split('.').reverse().join('.')
  hosts.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))

  return (
    <div>
      <h1>matrix {env}</h1>

      <table className="table">
        <thead>
          <tr>
            <td></td>
            {hosts.map((host, idx) => (
              <td
                className="spun"
                key={host}
                style={{ background: idx == hoverCol ? 'lightyellow' : '' }}
              >
                <span>{host}</span>
              </td>
            ))}
          </tr>
        </thead>
        <tbody onMouseLeave={() => setHoverCol(-1)}>
          {hosts.map((host, hostIdx) => (
            <tr key={host}>
              <td>{host}</td>
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
