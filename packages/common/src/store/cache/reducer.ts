import { ID, UID } from '~/models/Identifiers'
import { Status } from '~/models/Status'

import { Kind } from '../../models/Kind'

import { Metadata } from './types'

type CacheState = {
  entries: Record<ID, { _timestamp: number; metadata: Metadata }>
  statuses: Record<ID, Status>
  uids: Record<UID, ID>
  entryTTL: number
}

/**
 * The cache is implemented as primarily a map of ids to metadata (track, playlist, collection).
 * Each entry can have N number of uids that point to it, e.g. a track may appear
 * on the page twice, only cached once, but referenced to by different uids.
 *
 * Cache entries store metadata in the entries map and status on their retrieval in statuses.
 * The cache itself makes no guarantees as to whether statuses are updated.
 *
 * See the test.js for more detailed examples of usage.
 */
export const initialCacheState: CacheState = {
  // id => entry
  entries: {},
  // id => status
  statuses: {},
  // uid => id
  uids: {},
  entryTTL: Infinity
}

// These are fields we never want to merge -
// we should always prefer the latest update from
// backend.
const forceUpdateKeys = new Set([
  'field_visibility',
  'followee_reposts',
  'followee_saves',
  'stream_conditions',
  'download_conditions'
])

// Customize lodash recursive merge to never merge
// the forceUpdateKeys, and special-case
// playlist_contents
export const mergeCustomizer = (objValue: any, srcValue: any, key: string) => {
  if (forceUpdateKeys.has(key)) {
    return srcValue
  }

  if (key === 'is_verified') {
    return srcValue || objValue
  }

  // Delete is unidirectional (after marked deleted, future updates are not reflected)
  if (key === 'is_delete' && objValue === true && srcValue === false) {
    return objValue
  }

  // Not every user request provides collectible lists,
  // so always prefer it's existence, starting with latest
  if (key === 'collectibleList' || key === 'solanaCollectibleList') {
    return srcValue || objValue
  }

  if (key === 'stream_conditions' || key === 'download_conditions') {
    return srcValue || objValue
  }

  // For playlist_contents, this is trickier.
  // We want to never merge because playlists can have
  // tracks be deleted since last time, but
  // new fetches won't have UIDs, so we need to preserve those.
  if (objValue && key === 'playlist_contents') {
    // Map out tracks keyed by id, but store as an array-value
    // because a playlist can contain multiple of the same track id
    const trackMap = {}
    objValue.track_ids.forEach((t: { track: any }) => {
      const id = t.track
      if (id in trackMap) {
        trackMap[id].push(t)
      } else {
        trackMap[id] = [t]
      }
    })

    const trackIds = srcValue.track_ids.map((t: { track: string | number }) => {
      const mappedList = trackMap[t.track]
      if (!mappedList) return t

      const mappedTrack = mappedList.shift()
      if (!mappedTrack?.uid) return t

      return {
        ...t,
        uid: mappedTrack.uid
      }
    })

    return { ...srcValue, track_ids: trackIds }
  }
}
export const asCache =
  (
    reducer: {
      (
        state: CacheState | undefined,
        action: any,
        kind: Kind
      ): {
        // id => entry
        entries: {}
        // id => status
        statuses: {}
        // uid => id
        uids: {}
      }
      (arg0: any, arg1: any): any
    },
    kind: Kind
  ) =>
  (state: any, action: { kind: Kind | Kind[]; type: string | number }) => {
    if (
      action.kind &&
      (typeof action.kind === 'string'
        ? action.kind !== kind
        : !action.kind.includes(kind))
    ) {
      return state
    }

    return reducer(state, action, kind)
  }
