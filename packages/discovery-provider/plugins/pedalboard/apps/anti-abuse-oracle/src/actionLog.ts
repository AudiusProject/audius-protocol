import 'dotenv/config'

import postgres from 'postgres'
import { Utils } from '@audius/sdk'

export const sql = postgres(process.env.discoveryDbUrl || '')

type TipRow = {
  sender: UserDetails
  receiver: UserDetails
  amount: number
  timestamp: Date
}

export async function recentTips() {
  const tips = await sql<TipRow[]>`
    select
      (
        ${sql.unsafe(buildUserDetails)}
        where user_id = sender_user_id
      ) as sender,
      (
        ${sql.unsafe(buildUserDetails)}
        where user_id = receiver_user_id
      ) as receiver,
      amount,
      created_at as "timestamp"
    from user_tips
    order by slot desc limit 1000;`
  return tips
}

//
// User Details
//
export type UserDetails = {
  id: number
  handle: string
  name: string
  img: string
  isVerified: boolean

  amount?: number
}

const buildUserDetails = `
select json_build_object(
  'id', user_id,
  'handle', handle,
  'name', name,
  'isVerified', is_verified,
  'img', profile_picture_sizes
) as user
from users
`

export async function getUser(idOrHandle: string) {
  // try decode id
  // try parse int
  // try find handle
  const userId = Utils.decodeHashId(idOrHandle) || parseInt(idOrHandle)
  const rows = await sql`
  ${sql.unsafe(buildUserDetails)}
  where
    ${userId ? sql`user_id = ${userId}` : sql`handle_lc = ${idOrHandle.toLowerCase()}`}
  LIMIT 1
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
  where user_id = ${userId}
  `
  if (!rows.length) return
  return rows[0]
}

export async function getUserNormalizedScore(userId: number) {
  const rows = await sql`
WITH scoped_users as (
select * from users
where user_id = ${userId} 
order by created_at desc limit 100
),
play_activity AS (
    SELECT user_id, 
          COUNT(DISTINCT date_trunc('hour', plays.created_at)) AS play_count
    FROM plays
    WHERE user_id IS NOT NULL
    AND user_id in (select user_id from scoped_users)
    GROUP BY user_id
),
fast_challenge_completion AS (
    SELECT users.user_id, 
          handle_lc, 
          users.created_at, 
          COUNT(*) AS challenge_count, 
          ARRAY_AGG(user_challenges.challenge_id) AS challenge_ids
    FROM users
    LEFT JOIN user_challenges ON users.user_id = user_challenges.user_id
    WHERE user_challenges.is_complete
      AND user_challenges.completed_at - users.created_at <= INTERVAL '3 minutes'
      AND user_challenges.challenge_id != 'm'
    AND users.user_id in (select user_id from scoped_users)
    GROUP BY users.user_id, users.handle_lc, users.created_at
    ORDER BY users.created_at DESC
),
aggregate_scores AS (
    SELECT 
        users.handle_lc,
        users.created_at,
        COALESCE(play_activity.play_count, 0) AS play_count,
        COALESCE(fast_challenge_completion.challenge_count, 0) AS challenge_count,
        (COALESCE(play_activity.play_count, 0)) - (COALESCE(fast_challenge_completion.challenge_count, 0) * 3) AS overall_score
    FROM users
    LEFT JOIN play_activity ON users.user_id = play_activity.user_id
    LEFT JOIN fast_challenge_completion ON users.user_id = fast_challenge_completion.user_id
    WHERE users.handle_lc IS NOT NULL
    AND users.user_id in (select user_id from scoped_users)
    ORDER BY users.created_at DESC
)
SELECT 
	a.handle_lc,
 	a.created_at as "timestamp",
    a.play_count,
    a.challenge_count,
    a.overall_score,
    (a.overall_score + 15)::float / NULLIF(100, 0)::float AS normalized_score
FROM aggregate_scores a
ORDER BY normalized_score asc
  `
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
  details: Record<string, string | number | boolean>
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
        ${sql.unsafe(buildUserDetails)}
        where users.user_id = follows.followee_user_id
      ) as "details"
    from
      follows
    where follower_user_id = ${userId}
      and is_delete = false
    order by created_at desc
    limit ${limit}
  )

-- user sign up
union all
  (
    select
      created_at,
      'sign up',
      'user',
      json_build_object(
      )
    from
      users
    where user_id = ${userId}
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

-- challenge
union all
  (
    select
      completed_at as created_at,
      'challenge',
      challenge_id,
      json_build_object(
          'amount', amount
        )
    from user_challenges
    where user_id = ${userId}
    and is_complete
    order by completed_at desc
    limit ${limit}
  )

)

select * from separate_actions order by timestamp desc;
`
}
