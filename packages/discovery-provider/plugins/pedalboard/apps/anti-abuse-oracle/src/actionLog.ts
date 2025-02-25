import 'dotenv/config'

import postgres from 'postgres'

const sql = postgres(process.env.discoveryDbUrl || '')

//
// User Details
//
export type UserDetails = {
  id: string
  handle: string
  name: string
  img: string

  amount?: number
}

// const buildUserDetails = `
// select json_build_object(
//   'id', user_id,
//   'handle', handle,
//   'name', name,
//   'img', profile_picture_sizes
// ) as user
// from users
// `

export async function getUser(userId: number) {
  const rows = await sql`
  select json_build_object(
    'id', user_id,
    'handle', handle,
    'name', name,
    'img', profile_picture_sizes
  ) as user
  from users
  where user_id = ${userId}
  `
  if (!rows.length) return
  return rows[0].user as UserDetails
}

export async function getUserScore(userId: number) {
  const rows = await sql`
  select
    track_count > 0 as "hasTracks",
    playlist_count > 0 as "hasPlaylists",
    track_save_count > 1 as "saveCount",
    repost_count > 1 as "repostCount",
    following_count > 6 as "followingCount",
    (select count(*) > 0 from plays where user_id = ${userId}) as "hasPlays"
  from aggregate_user
  where user_id = ${userId}`
  if (!rows.length) return
  return rows[0]
}

//
// TrackDetails
//
export type TrackDetails = {
  id: string
  title: string
  img: string
}

const buildTrackDetails = `
select json_build_object(
  'id', track_id,
  'title', title,
  'img', cover_art_sizes,
  'artist_handle', handle,
  'artist_name', name
)
from tracks
join users on owner_id = user_id
`

//
// PlaylistDetails
//
export type PlaylistDetails = {
  id: number
  title: string
  img: string
}

const buildPlaylistDetails = `
select json_build_object(
  'id', playlist_id,
  'title', playlist_name,
  'img', playlist_image_sizes_multihash
)
from playlists
`

//
// ActionRow
//
export type ActionRow = {
  timestamp: Date
  verb: string
  target: string
  details: Record<string, string | number>
}

export async function actionLogForUser(userId: number) {
  const limit = 100
  return await sql<ActionRow[]>`

with separate_actions as (

-- follow user
  (
    select
      created_at as "timestamp",
      'follow' as "verb",
      'user' as "target",
      (
        select json_build_object(
          'id', user_id,
          'handle', handle,
          'name', name,
          'img', profile_picture_sizes
        )
        from users
        where users.user_id = follows.followee_user_id
      ) as "details"
    from
      follows
    where follower_user_id = ${userId}
      and is_delete = false
    order by created_at desc
    limit ${limit}
  )


-- repost track
union all

  (
    select
      created_at,
      'repost',
      'track',
      (
        ${sql.unsafe(buildTrackDetails)}
        where track_id = repost_item_id
      )
    from
      reposts
    where user_id = ${userId}
      and repost_type = 'track'
      and is_delete = false
    order by created_at desc
    limit ${limit}
  )

-- repost playlist
union all

  (
    select
      created_at,
      'repost',
      'playlist',
      (
        ${sql.unsafe(buildPlaylistDetails)}
        where playlist_id = repost_item_id
      )
    from
      reposts
    where user_id = ${userId}
      and repost_type = 'playlist'
      and is_delete = false
    order by created_at desc
    limit ${limit}
  )

-- save track
union all

  (
    select
      created_at,
      'save',
      'track',
      (
        ${sql.unsafe(buildTrackDetails)}
        where track_id = save_item_id
      )
    from
      saves
    where user_id = ${userId}
      and save_type = 'track'
      and is_delete = false
    order by created_at desc
    limit ${limit}
  )

-- save playlist
union all

  (
    select
      created_at,
      'save',
      'playlist',
      (
        ${sql.unsafe(buildPlaylistDetails)}
        where playlist_id = save_item_id
      )
    from
      saves
    where user_id = ${userId}
      and save_type = 'playlist'
      and is_delete = false
    order by created_at desc
    limit ${limit}
  )

-- create track
-- create playlist

-- tip
union all
  (
    select
      created_at,
      'tip',
      'user',
      (
        select json_build_object(
          'id', user_id,
          'handle', handle,
          'name', name,
          'img', profile_picture_sizes,
          'amount', amount
        )
        from users
        where user_id = receiver_user_id
      )
    from user_tips
    where sender_user_id = ${userId}
    order by created_at desc
    limit ${limit}
  )

-- listens
union all
  (
    select
      created_at,
      'listen',
      'track',
      (
        ${sql.unsafe(buildTrackDetails)}
        where track_id = play_item_id
      )
    from plays
    where user_id = ${userId}
    order by created_at desc
    limit ${limit}
  )

)
select * from separate_actions order by timestamp desc;
`
}
