import useSWR from 'swr'
import { SP, useDiscoveryProviders } from './useServiceProviders'

export function DiscoveryTrending() {
  const { data: sps, error } = useDiscoveryProviders()
  if (error) return <div>error</div>
  if (!sps) return null
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
  const { data, error } = useSWR(sp.endpoint + '/v1/full/tracks/trending', fetcher)

  if (!data)
    return (
      <tr>
        <td>{sp.endpoint}</td>
      </tr>
    )

  const tracks = data.data
  const latestChainBlock = data.latest_chain_block
  const latestIndexedBlock = data.latest_indexed_block
  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td>
        Latest Chain Block: {latestChainBlock}
      </td>
      <td>
        Latest Indexed Block: {latestIndexedBlock}
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
