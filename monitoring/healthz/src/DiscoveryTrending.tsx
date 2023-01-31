import useSWR from 'swr'
import { SP, useDiscoveryProviders } from './useServiceProviders'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DiscoveryTrending() {
  const { data: sps, error } = useDiscoveryProviders()
  if (!sps) return null

  const responses = sps.map((sp) => {
    const endpoint = sp.endpoint
    const res = useSWR(sp.endpoint + '/v1/full/tracks/trending', fetcher)
    return { endpoint: endpoint, res: res}
  }).sort((a, b) => {
    if (!a.res.data) {
      return -1
    }

    if (!b.res.data) {
      return -1
    }
    const aIndexedBlock = a.res.data.data.latest_indexed_block
    const bIndexedBlock = b.res.data.data.latest_indexed_block
    if (aIndexedBlock < bIndexedBlock) {
      return -1
    }
    if (aIndexedBlock > bIndexedBlock) {
      return 1
    }
    return 0
  })

  if (error) return <div>error</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>{sps.length}</h2>
      <table className="table">
        <tbody>
          {responses.map(({endpoint, res: {data, error}}, i) => (
            <TrendingRow key={endpoint} data={data} endpoint={endpoint}/>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrendingRow({ data, endpoint }: { data: any, endpoint: string }) {
  if (!data)
    return (
      <tr>
        <td>{endpoint}</td>
      </tr>
    )

  const tracks = data.data
  const latestChainBlock = data.latest_chain_block
  const latestIndexedBlock = data.latest_indexed_block
  return (
    <tr>
      <td>
        <a href={endpoint + '/health_check'} target="_blank">
          {endpoint.replace('https://', '')}
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
