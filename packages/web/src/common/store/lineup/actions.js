export const FETCH_LINEUP_METADATAS = 'FETCH_LINEUP_METADATAS'
export const FETCH_LINEUP_METADATAS_REQUESTED =
  'FETCH_LINEUP_METADATAS_REQUESTED'
export const FETCH_LINEUP_METADATAS_SUCCEEDED =
  'FETCH_LINEUP_METADATAS_SUCCEEDED'
export const FETCH_LINEUP_METADATAS_FAILED = 'FETCH_LINEUP_METADATAS_FAILED'

export const FETCH_TRACKS_METADATAS = 'FETCH_TRACKS_METADATAS'
export const FETCH_TRACKS_METADATAS_REQUESTED =
  'FETCH_TRACKS_METADATAS_REQUESTED'
export const FETCH_TRACKS_METADATAS_SUCCEEDED =
  'FETCH_TRACKS_METADATAS_SUCCEEDED'
export const FETCH_TRACKS_METADATAS_FAILED = 'FETCH_TRACKS_METADATAS_FAILED'

export const FETCH_TRACK_AUDIO = 'FETCH_TRACK_AUDIO'
export const FETCH_TRACK_AUDIO_REQUESTED = 'FETCH_TRACK_AUDIO_REQUESTED'
export const FETCH_TRACK_AUDIO_SUCCEEDED = 'FETCH_TRACK_AUDIO_SUCCEEDED'
export const UPDATE_LINEUP_ORDER = 'UPDATE_LINEUP_ORDER'

export const PLAY = 'PLAY'
export const PAUSE = 'PAUSE'

export const RESET = 'RESET'
export const RESET_SUCCEEDED = 'RESET_SUCCEEDED'

export const SET_IN_VIEW = 'SET_IN_VIEW'
export const REFRESH_IN_VIEW = 'REFRESH_IN_VIEW'

export const UPDATE_TRACK_METADATA = 'UPDATE_TRACK_METADATA'
export const REMOVE = 'REMOVE'
export const ADD = 'ADD'
export const SET_LOADING = 'SET_LOADING'

export const SET_PAGE = 'SET_PAGE'

export const addPrefix = (prefix, actionType) => {
  return `${prefix}_${actionType}`
}

export const stripPrefix = (prefix, actionType) => {
  return actionType.replace(`${prefix}_`, '')
}

/**
 * A generic class of common Lineup actions for fetching, loading and
 * simple playback.
 * @example
 *  // playlist.js
 *  // Creates lineup actions for a playlist, e.g.
 *  // PLAYLIST_FETCH_TRACKS_METADATAS.
 *  class PlaylistActions extends LineupActions {
 *    constructor () {
 *      super("PLAYLIST")
 *    }
 *  }
 *  export const playlistActions = new PlaylistActions()
 */
export class LineupActions {
  constructor(prefix, removeDeleted = false) {
    this.prefix = prefix
    this.removeDeleted = removeDeleted
  }

  getPrefix() {
    return this.prefix
  }

  /**
   * Fetches entity metadatas for the lineup.
   * Side-effect: Fetches relevant creators and caches loaded tracks.
   * @param {number} [offset] the offset into the "get tracks" query
   * @param {number} [limit] the limit for the "get tracks" query
   * @param {boolean} [overwrite] a boolean indicating whether to overwrite cached entries the fetch may be refetching
   * @param {*} [payload] keyword args payload to send to the "get tracks" query
   */
  fetchLineupMetadatas(offset = 0, limit = 10, overwrite = false, payload) {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS),
      offset,
      limit,
      overwrite,
      payload
    }
  }

  fetchLineupMetadatasRequested(
    offset = 0,
    limit = 10,
    overwrite = false,
    payload
  ) {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS_REQUESTED),
      offset,
      limit,
      overwrite,
      payload
    }
  }

  fetchLineupMetadatasSucceeded(entries, offset, limit, deleted) {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS_SUCCEEDED),
      entries,
      offset,
      limit,
      deleted
    }
  }

  fetchLineupMetadatasFailed() {
    return {
      type: addPrefix(this.prefix, FETCH_LINEUP_METADATAS_FAILED)
    }
  }

  fetchTrackAudio(trackMetadata) {
    return {
      type: addPrefix(this.prefix, FETCH_TRACK_AUDIO),
      trackMetadata: trackMetadata
    }
  }

  fetchTrackAudioRequested(index, trackId) {
    return {
      type: addPrefix(this.prefix, FETCH_TRACK_AUDIO_REQUESTED),
      index: index,
      trackId: trackId
    }
  }

  fetchTrackAudioSucceeded(index, trackId) {
    return {
      type: addPrefix(this.prefix, FETCH_TRACK_AUDIO_SUCCEEDED),
      index: index,
      trackId: trackId
    }
  }

  play(uid) {
    return {
      type: addPrefix(this.prefix, PLAY),
      uid
    }
  }

  pause() {
    return {
      type: addPrefix(this.prefix, PAUSE)
    }
  }

  updateTrackMetadata(trackId, metadata) {
    return {
      type: addPrefix(this.prefix, UPDATE_TRACK_METADATA),
      trackId,
      metadata
    }
  }

  updateLineupOrder(orderedIds) {
    return {
      type: addPrefix(this.prefix, UPDATE_LINEUP_ORDER),
      orderedIds
    }
  }

  // Side-effect: Unsubscribes this lineup from cache entries it is subscribed to.
  reset(source) {
    return {
      type: addPrefix(this.prefix, RESET),
      source
    }
  }

  resetSucceeded() {
    return {
      type: addPrefix(this.prefix, RESET_SUCCEEDED)
    }
  }

  add(entry, id) {
    return {
      type: addPrefix(this.prefix, ADD),
      entry,
      id
    }
  }

  remove(kind, uid) {
    return {
      type: addPrefix(this.prefix, REMOVE),
      kind,
      uid
    }
  }

  setInView(inView) {
    return {
      type: addPrefix(this.prefix, SET_IN_VIEW),
      inView
    }
  }

  // If limit is not provided, we use whatever is in the state
  refreshInView(overwrite = false, payload, limit = null) {
    return {
      type: addPrefix(this.prefix, REFRESH_IN_VIEW),
      overwrite,
      payload,
      limit
    }
  }

  setLoading() {
    return {
      type: addPrefix(this.prefix, SET_LOADING)
    }
  }

  setPage = page => {
    return {
      type: addPrefix(this.prefix, SET_PAGE),
      page
    }
  }
}
