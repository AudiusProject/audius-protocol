import { getEntry, getAllEntries } from '~/store/cache/selectors'
import { CommonState } from '~/store/commonStore'

import { Kind, ID, UID } from '../../../models'

import { BatchCachedTracks } from './types'

/** @deprecated Use useTrack instead */
export const getTrack = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null; permalink?: string | null }
) => {
  if (
    props.permalink &&
    state.tracks.permalinks[props.permalink.toLowerCase()]
  ) {
    props.id = state.tracks.permalinks[props.permalink.toLowerCase()]
  }
  return getEntry(state, {
    ...props,
    kind: Kind.TRACKS
  })
}

/** @deprecated Use useTracks instead */
export const getTracks = (
  state: CommonState,
  props: {
    ids?: ID[] | null
    uids?: UID[] | null
    permalinks?: string[] | null
  }
): { [id: number]: BatchCachedTracks } => {
  if (props && props.ids) {
    const tracks: { [id: number]: BatchCachedTracks } = {}
    props.ids.forEach((id) => {
      const track = getTrack(state, { id })
      if (track) {
        tracks[id] = { metadata: track }
      }
    })
    return tracks
  } else if (props && props.uids) {
    const tracks: { [id: number]: BatchCachedTracks } = {}
    props.uids.forEach((uid) => {
      const track = getTrack(state, { uid })
      if (track) {
        tracks[track.track_id] = { metadata: track }
      }
    })
    return tracks
  } else if (props && props.permalinks) {
    const tracks: { [permalink: string]: BatchCachedTracks } = {}
    props.permalinks.forEach((permalink) => {
      const track = getTrack(state, { permalink })
      if (track) tracks[permalink] = { metadata: track }
    })
    return tracks
  }
  return getAllEntries(state, { kind: Kind.TRACKS })
}
