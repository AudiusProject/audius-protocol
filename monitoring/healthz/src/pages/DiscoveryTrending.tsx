import useSWR from 'swr'
import { SP, useServiceProviders } from '../useServiceProviders'
import { useEnvironmentSelection } from '../components/EnvironmentSelector'

export function DiscoveryTrending(props: { trendingEndpoint: string }) {
  const [env] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, 'discovery')
  if (error) return <div className="text-red-600 dark:text-red-400">error</div>
  if (!sps) return null

  return (
    <div className="p-5 mt-8 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4 dark:text-gray-200">{sps.length}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse divide-y divide-gray-200 dark:divide-gray-700">
          <tbody className="bg-white dark:bg-gray-900">
            {sps.map((sp) => (
              <TrendingRow
                key={sp.endpoint}
                sp={sp}
                trendingEndpoint={props.trendingEndpoint}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function TrendingRow({ sp, trendingEndpoint }: { sp: SP; trendingEndpoint: string }) {
  const { data, error } = useSWR(sp.endpoint + trendingEndpoint, fetcher)
  if (!data) {
    return (
      <tr className="dark:bg-gray-900">
        <td className="p-4 dark:text-gray-300">{sp.endpoint}</td>
      </tr>
    )
  }

  const tracks = data.data

  return (
    <tr className="dark:bg-gray-900">
      <td className="p-4">
        <a href={`${sp.endpoint}/health_check`} target="_blank" className="text-blue-500 hover:underline dark:text-blue-400">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td className="p-4 whitespace-nowrap flex gap-2">
        {tracks.slice(0, 25).map((t: any) => (
          <a href={`https://audius.co${t.permalink}`} target="_blank" className="m-1 w-[80px]">
            <img src={t.artwork['150x150']} alt={t.title} className="rounded-md shadow-md w-[80px]" />
          </a>
        ))}
      </td>
    </tr>
  )
}
