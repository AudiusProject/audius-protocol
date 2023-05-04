import { useEffect, useState } from 'react'
import {
  EnvironmentSelector,
  useEnvironmentSelection,
} from './components/EnvironmentSelector'
import { useServiceProviders } from './useServiceProviders'

export function DMMatrix() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, nodeType)
  const [m, setM] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    setM({})
  }, [env])

  useEffect(() => {
    console.log('fetch sps', sps)
    sps?.map(async (sp) => {
      const resp = await fetch(sp.endpoint + `/comms/debug/cursors`)
      const data = await resp.json()
      const inner: any = {}
      for (let peer of data) {
        inner[peer.relayed_by] = peer.count
      }
      setM((m) => ({ ...m, [sp.endpoint]: inner }))
    })
  }, [sps])

  const hosts = Object.keys(m)
  hosts.sort()

  return (
    <div>
      <h1>matrix {env}</h1>

      <table className="table">
        <thead>
          <tr>
            <td></td>
            {hosts.map((host) => (
              <td key={host}>{host}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {hosts.map((host) => (
            <tr key={host}>
              <td>{host}</td>
              {hosts.map((other) => (
                <td key={other}>{m[host][other]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
