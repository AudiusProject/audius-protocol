import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { indexNames } from '../indexNames'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'
import { TrackDoc } from '../types/docs'
import { BaseIndexer } from './BaseIndexer'

export class TrackIndexer extends BaseIndexer<TrackDoc> {
  tableName = 'tracks'
  idColumn = 'track_id'
  indexName = indexNames.tracks
  batchSize = 500

  mapping: IndicesCreateRequest = {
    index: indexNames.tracks,
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0,
        refresh_interval: '5s',

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
        permalink: { type: 'keyword' },
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
        is_downloadable: { type: 'boolean' },

        // saves
        saved_by: { type: 'keyword' },
        save_count: { type: 'integer' },
        // reposts
        reposted_by: { type: 'keyword' },
        repost_count: { type: 'integer' },

        user: {
          properties: {
            handle: { type: 'keyword' }, // should it be text so we can search on it?
            location: { type: 'keyword' },
            name: { type: 'text' }, // should it be keyword with a `searchable` treatment?
            follower_count: { type: 'integer' },
            is_verified: { type: 'boolean' },
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
  }

  baseSelect(): string {
    return `
    -- etl tracks
    select 
      tracks.*,
      (tracks.download->>'is_downloadable')::boolean as is_downloadable,
      coalesce(aggregate_plays.count, 0) as play_count,
  
      json_build_object(
        'user_id', users.user_id,
        'handle', users.handle,
        'handle_lc', users.handle_lc,
        'name', users.name,
        'bio', users.bio,
        'location', users.location,
        'follower_count', coalesce(follower_count, 0),
        'is_creator', users.is_creator,
        'is_verified', users.is_verified,
        'is_deactivated', users.is_deactivated,
        'wallet', users.wallet,
        'erc_wallet', users.wallet,
        'spl_wallet', user_bank_accounts.bank_account,
        'balance', user_balances.balance,
        'waudio_balance', user_balances.waudio,
        'associated_wallets_balance', user_balances.associated_wallets_balance,
        'associated_sol_wallets_balance', user_balances.associated_sol_wallets_balance,
        'has_collectibles', users.has_collectibles,
        'track_count', track_count,
        'playlist_count', playlist_count,
        'album_count', album_count,
        'follower_count', follower_count,
        'followee_count', following_count,
        'repost_count', repost_count,
        'supporter_count', supporter_count,
        'supporting_count', supporting_count,
        'blocknumber', users.blocknumber,
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
      left join aggregate_user on users.user_id = aggregate_user.user_id
      left join user_balances on users.user_id = user_balances.user_id
      left join user_bank_accounts on users.wallet = user_bank_accounts.ethereum_address
      left join aggregate_plays on tracks.track_id = aggregate_plays.play_item_id
    WHERE tracks.is_current = true 
      AND users.is_current = true
    `
  }

  checkpointSql(checkpoint: BlocknumberCheckpoint): string {
    return `
    and track_id in (
      select track_id from tracks where is_current and blocknumber >= ${checkpoint.tracks}
      union
      select save_item_id from saves where is_current and save_type = 'track' and blocknumber >= ${checkpoint.saves}
      union
      select repost_item_id from reposts where is_current and repost_type = 'track' and blocknumber >= ${checkpoint.reposts}
      union
      select play_item_id FROM plays WHERE created_at > NOW() - INTERVAL '10 minutes'
    )
    `
  }

  withRow(row: TrackDoc) {
    row.tags = row.tags
    row.repost_count = row.reposted_by.length
    row.favorite_count = row.saved_by.length
    row.length = Math.ceil(
      row.track_segments.reduce((acc, s) => acc + parseFloat(s.duration), 0)
    )

    // permalink
    const currentRoute = row.routes[row.routes.length - 1]
    row.permalink = `/${row.user.handle}/${currentRoute}`
  }
}
