import { useQuery } from '@tanstack/react-query'
import useSWR from 'swr'
import { fetchApi } from './query'
import { SP } from './useServiceProviders'

export function DiscoveryTrending() {
  let { data } = useQuery(
    ['prod', 'discovery-node', '/v1/tracks/trending'],
    fetchApi
  )

  if (!data) return <div>loading</div>
  const sps = data

  return (
    <div style={{ padding: 20 }}>
      <h2>{sps.length}</h2>
      <table className="table">
        <tbody>
          {sps.map((sp) => (
            <TrendingRow key={sp.endpoint} sp={sp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function TrendingRow({ sp }: { sp: SP }) {
  if (!sp.health || !sp.apiJson) {
    return (
      <tr>
        <td>loading</td>
      </tr>
    )
  }
  console.log(sp)
  // return null

  const tracks = sp.apiJson
  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
        <br />
        {sp.health.data.block_difference}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {tracks.slice(0, 25).map((t: any) => (
          <a href={'https://audius.co' + t.permalink} target="_blank">
            <img src={t.artwork['150x150']} width={80} style={{ margin: 3 }} />
          </a>
        ))}
      </td>
    </tr>
  )
}
