import { useState } from 'react'
import useSWR from 'swr'
import { PlaylistTile, TrackTile, UserTile } from '../tiles'
import { SP, useDiscoveryProviders } from '../useServiceProviders'

export function DiscoverySearch() {
  const [q, setQ] = useState('')
  const { data: sps, error } = useDiscoveryProviders()
  if (error) return <div>error</div>
  if (!sps) return null

  return (
    <div className="p-5">
      <input
        type="text"
        placeholder="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded-md px-3 py-2 w-lg text-lg focus:border-blue-400 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      />

      <table className="table-auto w-full mt-4 border-collapse border">
        <tbody>
          {sps.map((sp) => (
            <SPRow key={sp.endpoint} sp={sp} q={q} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function SPRow({ sp, q }: { sp: SP; q: string }) {
  const { data, error } = useSWR(
    `${sp.endpoint}/v1/full/search/autocomplete?limit=12&offset=0&query=${encodeURIComponent(q)}&user_id=aNzoj`,
    fetcher
  )

  if (!data)
    return (
      <tr className="border">
        <td className="p-2 border">{sp.endpoint}</td>
      </tr>
    )

  const tracks = data.data?.tracks || []
  const playlists = data.data?.playlists || []
  const users = data.data?.users || []

  return (
    <tr className="border">
      <td className="p-2 border">
        <a href={`${sp.endpoint}/health_check`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
          {sp.endpoint.replace('https://', '')}
        </a>
      </td>
      <td className="p-2 border whitespace-nowrap flex">
        {tracks.map((t: any) => (
          <TrackTile key={t.track_id} track={t} />
        ))}
        <br />
        {playlists.map((t: any) => (
          <PlaylistTile key={t.playlist_id} playlist={t} />
        ))}
        <br />
        {users.map((t: any) => (
          <UserTile key={t.user_id} user={t} />
        ))}
      </td>
    </tr>
  )
}
