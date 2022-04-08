import _ from 'lodash'
import { keyBy } from 'lodash'
import { PlaylistDoc } from '../types/docs'
import { dialPg } from './conn'
import { indexNames } from './indexNames'
import { BlocknumberCheckpoint, Job } from './job'

// don't know how to do the sql to populate moods, genres, tags
// based on join with playlist_contents
// so uses withBatch callback to load that stuff up and attach it

export const playlistEtl: Job = {
  tableName: 'playlists',
  idField: 'playlist_id',
  indexBatchSize: 4000,
  indexSettings: {
    index: indexNames.playlists,
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
        playlist_owner_id: { type: 'keyword' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        is_album: { type: 'boolean' },
        is_private: { type: 'boolean' },
        is_delete: { type: 'boolean' },
        playlist_name: { type: 'text' },
        'playlist_contents.track_ids.track': { type: 'keyword' },

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
            tags: { type: 'keyword' },
          },
        },
      },
    },
  },

  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl playlists
    select 
      *,

      array(
        select user_id 
        from reposts
        where
          is_current = true
          and is_delete = false
          and repost_type = 'playlist' 
          and repost_item_id = playlist_id
          order by created_at desc
      ) as reposted_by,
    
      array(
        select user_id 
        from saves
        where
          is_current = true
          and is_delete = false
          and save_type = 'playlist' 
          and save_item_id = playlist_id
          order by created_at desc
      ) as saved_by

    from playlists 
    where is_current = true
    `

    if (checkpoint.playlists > 0) {
      // really we should mark playlist stale if any of the playlist tracks changes
      // but don't know how to do the sql for that... so the low tech solution would be to re-do playlists from scratch
      // which might actually be faster, since it's a very small collection
      // in which case we could just delete this function
      sql += `
      and playlist_id in (
        select playlist_id from playlists where is_current and blocknumber >= ${checkpoint.playlists}
        union
        select save_item_id from saves where is_current and save_type = 'playlist' and blocknumber >= ${checkpoint.saves}
        union
        select repost_item_id from reposts where is_current and repost_type = 'playlist' and blocknumber >= ${checkpoint.reposts}
      )`
    }

    return sql
  },

  async withBatch(rows: PlaylistDoc[]) {
    // collect all the track IDS
    const trackIds = new Set<number>()
    for (let row of rows) {
      row.playlist_contents.track_ids
        .map((t: any) => t.track)
        .filter(Boolean)
        .forEach((t: any) => trackIds.add(t))
    }

    // fetch the tracks...
    const tracksById = await pgTracksById(Array.from(trackIds))

    // pull track data onto playlist
    for (let playlist of rows) {
      playlist.tracks = playlist.playlist_contents.track_ids
        .map((t: any) => tracksById[t.track])
        .filter(Boolean)
    }
  },

  forEach: (row: PlaylistDoc) => {
    row.repost_count = row.reposted_by.length
    row.save_count = row.saved_by.length
  },
}

async function pgTracksById(trackIds: number[]) {
  if (!trackIds.length) return {}
  const pg = dialPg()
  const idList = Array.from(trackIds).join(',')
  // do we want artist name from users
  // or save + repost counts from aggregate_track?
  const q = `
    select 
      track_id, genre, mood, tags, title, length, created_at
    from tracks 
    where 
      is_current and not is_delete 
      and track_id in (${idList})`
  const allTracks = await pg.query(q)
  for (let t of allTracks.rows) {
    t.tags = t.tags?.split(',').filter(Boolean)
  }
  return keyBy(allTracks.rows, 'track_id')
}
