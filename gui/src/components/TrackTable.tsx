import { Avatar, Group, Menu, Table } from '@mantine/core'
import { ExternalLink, Plus } from 'tabler-icons-react'
import { NowPlaying } from '../stores/nowPlaying'
import { ArtistCard } from './ArtistCard'
import { LinkTo } from './LinkTo'
import { PlayButton } from './Player'
import { UserListModal } from './UserListModal'

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
      name: string
      handle: string
      bio?: string | null

      track_count: number
      follower_count: number
      following_count: number

      is_followed: boolean
      is_follower: boolean

      cover_photo_urls: string[]
      profile_picture_urls: string[]
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
                <Group>
                  <Avatar src={track.cover_art_urls[0]} size="lg" />
                  <PlayButton track={track} trackList={tracks} />
                  <LinkTo item={track} weight="bold">
                    {track.title}
                  </LinkTo>
                </Group>
              </td>
              <td>
                <ArtistCard user={track.owner} />
              </td>
              <td></td>
              <td>
                <UserListModal has_reposted_track_id={track.id}>
                  <div>{track.repost_count}</div>
                </UserListModal>
              </td>
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
