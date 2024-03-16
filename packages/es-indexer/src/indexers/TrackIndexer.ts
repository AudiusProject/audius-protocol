import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { merge } from 'lodash'
import { splitTags } from '../helpers/splitTags'
import { indexNames } from '../indexNames'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'
import { TrackDoc } from '../types/docs'
import { BaseIndexer } from './BaseIndexer'
import {
  lowerKeyword,
  noWhitespaceLowerKeyword,
  sharedIndexSettings,
  standardSuggest,
  standardText,
} from './sharedIndexSettings'

export class TrackIndexer extends BaseIndexer<TrackDoc> {
  constructor() {
    super('tracks', 'track_id')
    this.batchSize = 500
  }

  mapping: IndicesCreateRequest = {
    index: indexNames.tracks,
    settings: merge(sharedIndexSettings, {}),
    mappings: {
      dynamic: false,
      properties: {
        blocknumber: { type: 'integer' },
        owner_id: { type: 'keyword' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        permalink: { type: 'keyword' },
        route_id: { type: 'keyword' },
        routes: { type: 'keyword' },
        title: {
          ...lowerKeyword,
          fields: {
            searchable: standardText,
          },
        },
        tag_list: lowerKeyword,
        genre: { type: 'keyword' },
        mood: { type: 'keyword' },
        is_delete: { type: 'boolean' },
        is_unlisted: { type: 'boolean' },
        downloadable: { type: 'boolean' },
        purchaseable: { type: 'boolean' },

        // saves
        saved_by: { type: 'keyword' },
        save_count: { type: 'integer' },
        // reposts
        reposted_by: { type: 'keyword' },
        repost_count: { type: 'integer' },

        suggest: standardSuggest,

        user: {
          properties: {
            handle: {
              ...noWhitespaceLowerKeyword,
              fields: {
                searchable: standardText,
              },
            },
            name: {
              ...lowerKeyword,
              fields: {
                searchable: standardText,
              },
            },
            location: lowerKeyword,
            follower_count: { type: 'integer' },
            is_verified: { type: 'boolean' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },

        stem_of: {
          properties: {
            category: { type: 'keyword' },
            parent_track_id: { type: 'keyword' },
          },
        },

        'remix_of.tracks.parent_track_id': { type: 'keyword' },
        ai_attribution_user_id: { type: 'integer' },
      },
    },
  }

  baseSelect(): string {
    return `
    -- etl tracks
    select 
      tracks.*,
      case when tracks.stream_conditions->>'usdc_purchase'
        is not null then true
        else false
      end as purchaseable,
      tracks.is_downloadable as downloadable,
      coalesce(aggregate_plays.count, 0) as play_count,
  
      json_build_object(
        'handle', users.handle,
        'name', users.name,
        'location', users.location,
        'follower_count', follower_count,
        'is_verified', users.is_verified,
        'created_at', users.created_at,
        'updated_at', users.updated_at
      ) as user,

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
          is_delete = false
          and repost_type = 'track' 
          and repost_item_id = track_id
        order by created_at desc
      ) as reposted_by,
    
      array(
        select user_id 
        from saves
        where
          is_delete = false
          and save_type = 'track' 
          and save_item_id = track_id
        order by created_at desc
      ) as saved_by
    
    from tracks
      join users on owner_id = user_id 
      left join aggregate_user on users.user_id = aggregate_user.user_id
      left join aggregate_plays on tracks.track_id = aggregate_plays.play_item_id
    WHERE 1=1 
    `
  }

  checkpointSql(checkpoint: BlocknumberCheckpoint): string {
    return `
    and track_id in (
      select track_id from tracks where blocknumber >= ${checkpoint.tracks}
      union
      select save_item_id from saves where save_type = 'track' and blocknumber >= ${checkpoint.saves}
      union
      select repost_item_id from reposts where repost_type = 'track' and blocknumber >= ${checkpoint.reposts}
      union
      select play_item_id FROM plays WHERE created_at > NOW() - INTERVAL '10 minutes'
    )
    `
  }

  withRow(row: TrackDoc) {
    row.suggest = [row.title, row.user.handle, row.user.name]
      .filter((x) => x)
      .join(' ')
    row.tag_list = splitTags(row.tags)
    row.repost_count = row.reposted_by.length
    row.favorite_count = row.saved_by.length

    // get_feed_es uses `created_at` for tracks + playlists + reposts to sequence events
    // and has additional logic to compute the "earliest" created_at for an item
    // that can be either a track or a repost.
    //
    // while it would be possible to go adjust all this logic to conditionally use release_date for tracks
    // it's much easier to set the `created_at` to be `release_date` for tracks.
    //
    // my hope is to revisit the action_log concept which will simplify this complex feed logic.
    row.created_at = row.release_date || row.created_at

    // permalink
    const currentRoute = row.routes[row.routes.length - 1]
    row.permalink = `/${row.user.handle}/${currentRoute}`
  }
}
