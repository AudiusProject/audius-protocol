import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { groupBy } from 'lodash'
import { dialPg } from '../../etl/conn'
import { indexNames } from '../../etl/indexNames'
import { BlocknumberCheckpoint } from '../../etl/job'
import { UserDoc } from '../../types/docs'
import { BaseIndexer } from './BaseIndexer'

export class UserIndexer extends BaseIndexer<UserDoc> {
  tableName = 'users'
  idColumn = 'user_id'
  indexName = indexNames.users

  mapping: IndicesCreateRequest = {
    index: indexNames.users,
    settings: {
      index: {
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
  }

  baseSelect(): string {
    return `
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
  }

  checkpointSql(checkpoint: BlocknumberCheckpoint): string {
    return `
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
  }

  async withBatch(rows: UserDoc[]) {
    // attach user's tracks
    const userIds = rows.map((r) => r.user_id)
    const tracksByOwnerId = await this.userTracks(Array.from(userIds))
    for (let user of rows) {
      user.tracks = tracksByOwnerId[user.user_id] || []
      user.track_count = user.tracks.length
    }
  }

  withRow(row: UserDoc) {
    row.following_count = row.following_ids.length
  }

  private async userTracks(userIds: number[]) {
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
}
