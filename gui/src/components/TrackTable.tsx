import { Menu, Table } from '@mantine/core'
import { ExternalLink, Plus } from 'tabler-icons-react'
import { NowPlaying } from '../stores/nowPlaying'
import { LinkTo } from './LinkTo'
import { PlayButton } from './Player'

type TrackTableProps = {
  title?: string
  tracks: {
    id: string
    title: string
    // route_id: string
    repost_count: number
    favorite_count: number
    cover_art_urls: string[]
    stream_urls: string[]
    // length: number
    // created_at: any

    owner: {
      id: string
      handle: string
      name: string
    }
  }[]
}

export function TrackTable({ title, tracks }: TrackTableProps) {
  let { isThisTrackPlaying, addToQueue } = NowPlaying.useContainer()

  return (
    <div>
      {title && <h2>{title}</h2>}
      <Table>
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th>Title</th>
            <th>Artist</th>
            <th>Length</th>
            <th>Reposts</th>
            <th>Favs</th>
            <th>Posted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id}>
              <td>
                <PlayButton track={track} trackList={tracks} />
              </td>
              <td></td>
              <td>
                <LinkTo item={track} weight="bold">
                  {track.title}
                </LinkTo>
              </td>
              <td>
                <LinkTo item={track.owner}>
                  <span>{track.owner.name}</span>
                </LinkTo>
              </td>
              <td></td>
              <td>{track.repost_count}</td>
              <td>{track.favorite_count}</td>
              <td>
                {/* <TimeAgo date={Date.parse(track.created_at)} timeStyle="mini" /> */}
              </td>

              <td>
                {/* <Menu>
                  <Menu.Item
                    icon={<Plus size={14} />}
                    onClick={() => addToQueue(track)}
                  >
                    Add to Queue
                  </Menu.Item>
                  <Menu.Label>Debug</Menu.Label>
                  <Menu.Item
                    icon={<ExternalLink size={14} />}
                    component="a"
                    href={`https://audius.co/${track.route_id}`}
                    target="_blank"
                  >
                    Song on Audius
                  </Menu.Item>
                  <Menu.Item
                    icon={<ExternalLink size={14} />}
                    component="a"
                    href={`https://audius.co/${track.owner.handle}`}
                    target="_blank"
                  >
                    Artist on Audius
                  </Menu.Item>
                </Menu> */}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
