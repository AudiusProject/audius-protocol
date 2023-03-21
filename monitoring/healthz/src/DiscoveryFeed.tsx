import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { PlaylistTile, TrackTile } from './tiles'
import { SP, useDiscoveryProviders } from './useServiceProviders'

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
    <div style={{ padding: 20 }}>
      <input
        type="text"
        placeholder="user id"
        value={userID}
        onChange={(e) => setUserID(e.target.value)}
      />

      <table className="table">
        <tbody>
          {sps.map((sp) => (
            <FeedRow userID={userID} key={sp.endpoint} sp={sp} />
          ))}
        </tbody>
      </table>
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
      <tr>
        <td>{sp.endpoint}</td>
      </tr>
    )

  return (
    <tr>
      <td>
        <a href={sp.endpoint + '/health_check'} target="_blank">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
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
