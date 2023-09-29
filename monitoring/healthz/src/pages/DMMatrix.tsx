import { useEffect, useState } from 'react'
import { useEnvironmentSelection } from '../components/EnvironmentSelector'
import { useServiceProviders } from '../useServiceProviders'
import useSWR from 'swr'
import { fetcher } from '../query'

const todayDate = new Date().toISOString().substring(0, 10)

export function DMMatrix() {
  const [env, nodeType] = useEnvironmentSelection()
  const [since, setSince] = useState(todayDate)
  const { data: sps, error } = useServiceProviders(env, nodeType)
  const [m, setM] = useState<Record<string, Record<string, { count: number; relayed_at: string; rpc_cursor: string }>>>({})
  const [hoverCol, setHoverCol] = useState(-1)

  useEffect(() => {
    setM({})
  }, [env])

  useEffect(() => {
    sps?.map(async (sp) => {
      const sinceParam = encodeURIComponent(new Date(since).toISOString())
      const resp = await fetch(sp.endpoint + `/comms/debug/cursors?since=${sinceParam}`)
      const data = await resp.json()
      const inner: any = {}
      for (let peer of data) {
        inner[peer.relayed_by] = peer
      }
      setM((m) => ({ ...m, [sp.endpoint]: inner }))
    })
  }, [sps, since])

  const hosts = Object.keys(m)
  const hostSortKey = (host: string) => new URL(host).hostname.split('.').reverse().join('.')
  hosts.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))

  return (
    <div className="p-5 mt-8 dark:bg-gray-800">
      <input
        type="date"
        value={since}
        onChange={(e) => setSince(e.target.value)}
        className="border rounded-md px-3 py-2 mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr className="dark:bg-gray-800">
              <th scope="col" className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"></th>
              <th scope="col" className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">blockdiff</th>
              {hosts.map((host, idx) => (
                <th
                  key={host}
                  className={`px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 ${idx === hoverCol ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
                >
                  {host.replace('https://', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody onMouseLeave={() => setHoverCol(-1)} className="bg-white dark:bg-gray-800">
            {hosts.map((host, hostIdx) => (
              <tr key={host}>
                <td className="px-4 py-2">{host.replace('https://', '')}</td>
                <HealthCell host={host} />
                {hosts.map((other, idx) => (
                  <td
                    key={other}
                    className={`px-4 py-2 text-center ${idx === hostIdx ? 'bg-gray-300 dark:bg-gray-500' : idx === hoverCol ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
                    onMouseEnter={() => setHoverCol(idx)}
                  >
                    {m[host][other]?.count && (
                      <span title={`max(relayed_at) = ${m[host][other].relayed_at}\nrpc_cursor.relayed_at = ${m[host][other].rpc_cursor}`}>
                        {m[host][other].count}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HealthCell({ host }: { host: string }) {
  const { data, error } = useSWR(host + '/health_check', fetcher)
  const health = data?.data

  if (error) return <td className="px-4 py-2 text-red-600 dark:text-red-400">error</td>
  if (!health) return <td className="px-4 py-2 dark:text-gray-300">...</td>

  return <td className="px-4 py-2 text-center dark:text-gray-300">{health.block_difference}</td>
}
