import { TrackDoc } from '../types/docs'
import { indexNames } from './indexNames'
import { BlocknumberCheckpoint, Job } from './job'

export const trackEtl: Job = {
  tableName: 'tracks',
  idField: 'track_id',
  indexSettings: {
    index: indexNames.tracks,
    settings: {
      index: {
        refresh_interval: '10s',
        number_of_shards: 1,
        number_of_replicas: 0,

        analysis: {
          normalizer: {
            lower_ascii: {
              type: 'custom',
              char_filter: [],
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
    },
    mappings: {
      dynamic: false,
      properties: {
        blocknumber: { type: 'integer' },
        owner_id: { type: 'keyword' },
        created_at: { type: 'date' },
        route_id: { type: 'keyword' },
        routes: { type: 'keyword' },
        title: { type: 'text' },
        description: { type: 'text' },
        length: { type: 'integer' },
        tags: {
          type: 'keyword',
          normalizer: 'lower_ascii',
        },
        genre: { type: 'keyword' },
        mood: { type: 'keyword' },
        is_delete: { type: 'boolean' },
        is_unlisted: { type: 'boolean' },

        // saves
        saved_by: { type: 'keyword' },
        save_count: { type: 'integer' },
        // reposts
        reposted_by: { type: 'keyword' },
        repost_count: { type: 'integer' },

        artist: {
          properties: {
            handle: { type: 'keyword' },
            location: { type: 'keyword' },
            name: { type: 'text' }, // should it be keyword with a `searchable` treatment?
            follower_count: { type: 'integer' },
          },
        },

        stem_of: {
          properties: {
            category: { type: 'keyword' },
            parent_track_id: { type: 'keyword' },
          },
        },

        'remix_of.tracks.parent_track_id': { type: 'keyword' },
      },
    },
  },

  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl tracks
    select 
      tracks.*,
      aggregate_plays.count as play_count,

      json_build_object(
        'handle', users.handle,
        'name', users.name,
        'location', users.location,
        'follower_count', follower_count
      ) as artist,

      array(
        select slug 
        from track_routes r
        where
          r.track_id = tracks.track_id
        order by is_current
      ) as routes,

      array(
        select user_id 
        from reposts
        where
          is_current = true
          and is_delete = false
          and repost_type = 'track' 
          and repost_item_id = track_id
        order by created_at desc
      ) as reposted_by,
    
      array(
        select user_id 
        from saves
        where
          is_current = true
          and is_delete = false
          and save_type = 'track' 
          and save_item_id = track_id
        order by created_at desc
      ) as saved_by
    
    from tracks
    join users on owner_id = user_id 
    join aggregate_user on users.user_id = aggregate_user.user_id
    join aggregate_plays on tracks.track_id = aggregate_plays.play_item_id
      WHERE tracks.is_current = true 
        AND users.is_current = true
    `

    if (checkpoint.tracks > 0) {
      // Find stale tracks including saves, reposts
      sql += `
      and track_id in (
        select track_id from tracks where is_current and blocknumber >= ${checkpoint.tracks}
        union
        select save_item_id from saves where is_current and save_type = 'track' and blocknumber >= ${checkpoint.saves}
        union
        select repost_item_id from reposts where is_current and repost_type = 'track' and blocknumber >= ${checkpoint.reposts}
        union
        select play_item_id FROM plays WHERE created_at > NOW() - INTERVAL '5 minutes'
      )`
    }

    return sql
  },

  forEach: (row: TrackDoc) => {
    row.tags = row.tags ? row.tags.split(',') : []
    row.repost_count = row.reposted_by.length
    row.save_count = row.saved_by.length

    row.length = Math.ceil(
      row.track_segments.reduce((acc, s) => acc + parseFloat(s.duration), 0)
    )

    // some alternate routes...
    // unshift because last one is_current
    let slug = row.route_id.substring(row.route_id.indexOf('/') + 1)
    row.routes.unshift(slug)
    row.routes.unshift(`${slug}-${row.track_id}`)
  },
}
