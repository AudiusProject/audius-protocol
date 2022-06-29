import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { keyBy, merge } from 'lodash'
import { dialPg } from '../conn'
import { splitTags } from '../helpers/splitTags'
import { indexNames } from '../indexNames'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'
import { PlaylistDoc } from '../types/docs'
import { BaseIndexer } from './BaseIndexer'
import {
  sharedIndexSettings,
  standardSuggest,
  standardText,
} from './sharedIndexSettings'

export class PlaylistIndexer extends BaseIndexer<PlaylistDoc> {
  constructor() {
    super('playlists', 'playlist_id')
  }

  mapping: IndicesCreateRequest = {
    index: indexNames.playlists,
    settings: merge(sharedIndexSettings, {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0,
        refresh_interval: '5s',
      },
    }),
    mappings: {
      dynamic: false,
      properties: {
        blocknumber: { type: 'integer' },
        playlist_owner_id: { type: 'keyword' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        is_album: { type: 'boolean' },
        is_private: { type: 'boolean' },
        is_delete: { type: 'boolean' },
        suggest: standardSuggest,
        playlist_name: {
          type: 'keyword',
          fields: {
            searchable: standardText,
          },
        },
        'playlist_contents.track_ids.track': { type: 'keyword' },

        user: {
          properties: {
            handle: {
              type: 'keyword',
              fields: {
                searchable: standardText,
              },
            },
            name: {
              type: 'keyword',
              fields: {
                searchable: standardText,
              },
            },
            location: { type: 'keyword' },
            follower_count: { type: 'integer' },
            is_verified: { type: 'boolean' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },

        // saves
        saved_by: { type: 'keyword' },
        save_count: { type: 'integer' },
        // reposts
        reposted_by: { type: 'keyword' },
        repost_count: { type: 'integer' },

        tracks: {
          properties: {
            mood: { type: 'keyword' },
            genre: { type: 'keyword' },
            tags: {
              type: 'keyword',
              normalizer: 'lower_asciifolding',
            },
            play_count: { type: 'integer' },
            repost_count: { type: 'integer' },
            save_count: { type: 'integer' },
          },
        },
      },
    },
  }

  baseSelect(): string {
    return `
      -- etl playlists
      select 
        playlists.*,

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
          select user_id 
          from reposts
          where
            is_current = true
            and is_delete = false
            and repost_type = (case when is_album then 'album' else 'playlist' end)::reposttype
            and repost_item_id = playlist_id
            order by created_at desc
        ) as reposted_by,
      
        array(
          select user_id 
          from saves
          where
            is_current = true
            and is_delete = false
            and save_type = (case when is_album then 'album' else 'playlist' end)::savetype
            and save_item_id = playlist_id
            order by created_at desc
        ) as saved_by

      from playlists 
      join users on playlist_owner_id = user_id
      left join aggregate_user on users.user_id = aggregate_user.user_id
      where 
        playlists.is_current
        AND users.is_current
    `
  }

  checkpointSql(checkpoint: BlocknumberCheckpoint): string {
    // really we should mark playlist stale if any of the playlist tracks changes
    // but don't know how to do the sql for that... so the low tech solution would be to re-do playlists from scratch
    // which might actually be faster, since it's a very small collection
    // in which case we could just delete this function

    // track play_count will also go stale (same problem as above)

    return `
      and playlist_id in (
        select playlist_id from playlists where is_current and blocknumber >= ${checkpoint.playlists}
        union
        select save_item_id from saves where is_current and save_type in ('playlist', 'album') and blocknumber >= ${checkpoint.saves}
        union
        select repost_item_id from reposts where is_current and repost_type in ('playlist', 'album') and blocknumber >= ${checkpoint.reposts}
      )`
  }

  async withBatch(rows: PlaylistDoc[]) {
    // collect all the track IDs
    const trackIds = new Set<number>()
    for (let row of rows) {
      row.playlist_contents.track_ids
        .map((t: any) => t.track)
        .filter(Boolean)
        .forEach((t: any) => trackIds.add(t))
    }

    // fetch the tracks...
    const tracksById = await this.getTracks(Array.from(trackIds))

    // pull track data onto playlist
    for (let playlist of rows) {
      playlist.tracks = playlist.playlist_contents.track_ids
        .map((t: any) => tracksById[t.track])
        .filter(Boolean)

      playlist.total_play_count = playlist.tracks.reduce(
        (acc, s) => acc + parseInt(s.play_count),
        0
      )
    }
  }

  withRow(row: PlaylistDoc) {
    row.suggest = [row.playlist_name, row.user.handle, row.user.name]
      .filter((x) => x)
      .join(' ')
    row.repost_count = row.reposted_by.length
    row.save_count = row.saved_by.length
  }

  private async getTracks(trackIds: number[]) {
    if (!trackIds.length) return {}
    const pg = dialPg()
    const idList = Array.from(trackIds).join(',')
    // do we want artist name from users
    // or save + repost counts from aggregate_track?
    const q = `
      select 
        track_id,
        genre,
        mood,
        tags,
        title,
        length,
        created_at,
        coalesce(aggregate_track.repost_count, 0) as repost_count,
        coalesce(aggregate_track.save_count, 0) as save_count,
        coalesce(aggregate_plays.count, 0) as play_count
  
      from tracks
      left join aggregate_track using (track_id)
      left join aggregate_plays on tracks.track_id = aggregate_plays.play_item_id
      where 
        is_current 
        and not is_delete 
        and not is_unlisted 
        and track_id in (${idList})`
    const allTracks = await pg.query(q)
    for (let t of allTracks.rows) {
      t.tags = splitTags(t.tags)
    }
    return keyBy(allTracks.rows, 'track_id')
  }
}
