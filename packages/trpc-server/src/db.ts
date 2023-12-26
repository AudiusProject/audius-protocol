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
    where is_current = true
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

type AugmentedPlaylistRows = (APlaylist & {
  artistHandle?: string
})[]

export async function selectPlaylistsCamel(p: SelectPlaylistProps) {
  const rows = await sql<AugmentedPlaylistRows>`
    select users.handle as artist_handle, ${
      p.cols ? sql(p.cols) : sql`pl_with_slug.*`
    }
    from (
      select *, (
        select slug
        from playlist_routes pr
        where
        pr.playlist_id = playlists.playlist_id and is_current = 'true'
        )
      from playlists
    ) as pl_with_slug
    left join users on playlist_owner_id = user_id
    left join aggregate_playlist using (playlist_id, is_album)
    where pl_with_slug.is_current = true
    ${p.isAlbum != undefined ? sql`and is_album = ${p.isAlbum}` : sql``}
    ${p.ids ? sql`and playlist_id in ${sql(p.ids)}` : sql``}
    ${p.ownerId ? sql`and playlist_owner_id = ${p.ownerId}` : sql``}
    order by pl_with_slug.created_at desc
  `

  if (p.cols && !p.cols?.includes('permalink')) return rows
  rows.forEach((row) => {
    row.permalink = `/${row.artistHandle}/${
      row.isAlbum ? 'album' : 'playlist'
    }/${row.slug}`
    delete row.artistHandle
  })

  return rows
}
