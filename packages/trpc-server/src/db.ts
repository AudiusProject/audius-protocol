import postgres from 'postgres'
import { APlaylist, ATrack, AUser } from './types'

const connectionString = process.env.audius_db_url || ''

if (!connectionString) {
  console.log('audius_db_url is required')
  process.exit(1)
}

export const sql = postgres(connectionString, {
  transform: postgres.camel,
  debug: (conn, query, args) => {
    // console.log(query.replace(/\s+/g, ' '), args)
  },
  types: {
    bigint: {
      to: 20,
      from: [20],
      serialize: (x: any) => x.toString(),
      parse: (x: any) => +x,
    },
  },
})

//
// USERS
//
export type SelectUserProps = {
  ids?: number[]
  handle?: string
}

export async function selectUsersCamel(p: SelectUserProps) {
  return sql<AUser[]>`
    select *
    from users
    left join aggregate_user agg using (user_id)
    where 1 = 1
    ${p.ids ? sql`and user_id in ${sql(p.ids)}` : sql``}
    ${p.handle ? sql`and handle_lc = lower(${p.handle})` : sql``}
  `
}

//
// TRACKS
//
export type SelectTrackProps = {
  ids?: any[]
  cols?: string[]
  ownerId?: number
  onlyPublic?: boolean
}

export async function selectTracksCamel(p: SelectTrackProps) {
  return sql<ATrack[]>`
    select ${p.cols ? sql(p.cols) : sql`*`}
    from tracks
    left join aggregate_track agg using (track_id)
    where is_current = true

    ${p.ids ? sql`and track_id in ${sql(p.ids)}` : sql``}
    ${p.ownerId ? sql`and owner_id = ${p.ownerId}` : sql``}

    ${
      p.onlyPublic
        ? sql`
          and is_available = true
          and is_delete = false
          and is_unlisted = false
          and stem_of is null
          and remix_of is null
        `
        : sql``
    }

    order by created_at desc
  `
}

//
// PLAYLISTS
//
export type SelectPlaylistProps = {
  cols?: string[]
  ids?: number[]
  isAlbum?: boolean
  ownerId?: number
}

export async function selectPlaylistsCamel(p: SelectPlaylistProps) {
  return sql<APlaylist[]>`
    select ${p.cols ? sql(p.cols) : sql`*`}
    from playlists
    left join aggregate_playlist using (playlist_id, is_album)
    where is_current = true
    ${p.isAlbum != undefined ? sql`and is_album = ${p.isAlbum}` : sql``}
    ${p.ids ? sql`and playlist_id in ${sql(p.ids)}` : sql``}
    ${p.ownerId ? sql`and playlist_owner_id = ${p.ownerId}` : sql``}
    order by created_at desc
  `
}
