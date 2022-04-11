import { groupBy } from 'lodash'
import { UserDoc } from '../types/docs'
import { dialPg } from './conn'
import { indexNames } from './indexNames'
import { BlocknumberCheckpoint, Job } from './job'

export const userEtl: Job = {
  tableName: 'users',
  idField: 'user_id',
  indexSettings: {
    index: indexNames.users,
    settings: {
      index: {
        refresh_interval: '10s',
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    },
    mappings: {
      dynamic: false,
      properties: {
        blocknumber: { type: 'integer' },
        created_at: { type: 'date' },
        wallet: { type: 'keyword' },
        handle: { type: 'keyword' }, // should have a "searchable" treatment
        name: { type: 'text' }, // default should be keyword, with a searchable treatment
        is_creator: { type: 'boolean' },
        is_verified: { type: 'boolean' },
        is_deactivated: { type: 'boolean' },
        bio: { type: 'text' },
        location: { type: 'keyword' },

        // following
        following_ids: { type: 'keyword' },
        following_count: { type: 'integer' },

        // followers
        follower_count: { type: 'integer' },

        track_count: { type: 'integer' },
        tracks: {
          properties: {
            mood: { type: 'keyword' },
            genre: { type: 'keyword' },
            tags: { type: 'keyword' },
          },
        },
      },
    },
  },

  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl users
    select 
      *,
    
      array(
        select followee_user_id 
        from follows
        where follower_user_id = users.user_id
        and is_current = true
        and is_delete = false
        order by created_at desc
      ) as following_ids
      
    from
      users
      join aggregate_user using (user_id)
    where 
      is_current = true
    `

    if (checkpoint.users > 0) {
      // TODO: this _should_ use checkpoint.follows for follows table
      // but that index is not being populated by etl
      // so it'll just use the user blocknumber checkpoint for now
      // which is probably fine, since follows move ahead of users typically

      sql += `
      and users.user_id in (
        select user_id from users where is_current and blocknumber >= ${checkpoint.users}
        union
        select follower_user_id from follows where is_current and blocknumber >= ${checkpoint.users}
        union
        select followee_user_id from follows where is_current and blocknumber >= ${checkpoint.users}
        union
        select owner_id from tracks where is_current and blocknumber >= ${checkpoint.tracks}
      )
      `

      // if above is too slow... this might be good enough for now
      // also the aggregate_user table could have a blocknumber or updated_at column we could just query
      // or we could scan the whole aggregate_user every time and find rows diff from last time
      // sql += ` and blocknumber >= ${checkpoint.users} `
    }

    return sql
  },

  async withBatch(rows: UserDoc[]) {
    // collect all the track IDS
    const userIds = rows.map((r) => r.user_id)

    // fetch the tracks...
    const tracksByOwnerId = await pgTracksForUsers(Array.from(userIds))

    // pull track data onto playlist
    for (let user of rows) {
      user.tracks = tracksByOwnerId[user.user_id] || []
      user.track_count = user.tracks.length
    }
  },

  forEach: (row: UserDoc) => {
    row.following_count = row.following_ids.length
  },
}

async function pgTracksForUsers(userIds: number[]) {
  if (!userIds.length) return {}
  const pg = dialPg()
  const idList = Array.from(userIds).join(',')
  const q = `
    select 
      track_id, owner_id, genre, mood, tags, title, length, created_at
    from tracks 
    where 
      is_current
      and not is_delete 
      and not is_unlisted
      and stem_of is null
      and owner_id in (${idList})
    order by created_at desc
      `
  const allTracks = await pg.query(q)
  for (let t of allTracks.rows) {
    t.tags = t.tags?.split(',').filter(Boolean)
  }
  const grouped = groupBy(allTracks.rows, 'owner_id')
  return grouped
}
