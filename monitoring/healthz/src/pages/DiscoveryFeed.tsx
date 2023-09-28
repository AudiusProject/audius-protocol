import { useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { PlaylistTile, TrackTile } from '../tiles'
import { SP, useDiscoveryProviders } from '../useServiceProviders'

export function DiscoveryFeed() {
  const [params, setParams] = useSearchParams()
  const userID = params.get('userID') || '1'
  const { data: sps, error } = useDiscoveryProviders()

  function setUserID(val: string) {
    params.set('userID', val)
    setParams(params)
  }

  if (error) return <div>error</div>
  if (!sps) return null

  return (
    <div className="p-5">
      <input
        type="text"
        placeholder="user id"
        value={userID}
        onChange={(e) => setUserID(e.target.value)}
        className="border rounded-md px-3 py-2 w-lg text-lg focus:border-blue-400 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      />
      <div className="overflow-x-scroll mt-4">
        <table className="table-auto w-full border-collapse border">
          <tbody>
            {sps.map((sp) => (
              <FeedRow userID={userID} key={sp.endpoint} sp={sp} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const fetcher = (endpoint: string, userID: string) => {
  if (!userID) return
  return fetch(endpoint, {
    headers: {
      'x-user-id': userID,
    },
  }).then((res) => res.json())
}


function FeedRow({ sp, userID }: { sp: SP; userID: string }) {
  const { data, error } = useSWR(
    [sp.endpoint + '/feed?offset=0&limit=22&with_users=true', userID],
    fetcher
  )

  const items = data?.data

  if (!items)
    return (
      <tr className="border">
        <td className="p-2 border">{sp.endpoint}</td>
      </tr>
    )

  return (
    <tr className="border">
      <td className="p-2 border">
        <a href={sp.endpoint + '/health_check'} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td className="p-4 md:p-2 border flex gap-2">
        {items.map((t: any) =>
          t.track_id ? (
            <TrackTile key={t.track_id} track={t} />
          ) : (
            <PlaylistTile key={t.playlist_id} playlist={t} />
          )
        )}
      </td>
    </tr>
  )
}

