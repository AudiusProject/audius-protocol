import Status from 'common/models/Status'
import {
  FETCH_LINEUP_METADATAS_REQUESTED,
  FETCH_LINEUP_METADATAS_SUCCEEDED,
  FETCH_LINEUP_METADATAS_FAILED,
  SET_LOADING,
  ADD,
  REMOVE,
  SET_IN_VIEW,
  UPDATE_LINEUP_ORDER,
  SET_PAGE,
  stripPrefix
} from 'store/lineup/actions'

export const initialLineupState = {
  // Contains identifiers for cache entries as well as retained metadata.
  // array<id, uid, ...>
  entries: [],
  entryIds: null,
  // Maps unique ids to their index in entries:
  // entry.uid => current index in entries
  order: {},
  page: 0,
  isMetadataLoading: false,
  total: 0,
  deleted: 0,
  status: Status.LOADING,
  hasMore: true,
  inView: false,
  // Boolean if the lineup should remove duplicate content in entries
  dedupe: false,
  // Boolean if the lineup fetch call pagination includes deleted tracks/collections
  // e.g. This should be true if we request 10 tracks but only get 9 back because
  // one is deleted
  // - Used to know if the lineup should stop fetching more content
  containsDeleted: true,
  // Whether the lineup is limited to a certain length
  maxEntries: null
}

export const actionsMap = {
  [SET_IN_VIEW](state, action) {
    return {
      ...state,
      inView: action.inView
    }
  },
  [FETCH_LINEUP_METADATAS_REQUESTED](state, action) {
    const newState = { ...state }
    if (action.offset === 0) newState.entryIds = new Set([])
    newState.total = action.limit + action.offset
    newState.status = Status.LOADING
    newState.isMetadataLoading = true
    return newState
  },
  [FETCH_LINEUP_METADATAS_SUCCEEDED](state, action) {
    const newState = { ...state }
    newState.isMetadataLoading = false
    newState.status = Status.SUCCESS
    newState.hasMore =
      action.entries.length + action.deleted >= action.limit - action.offset

    // If the lineup does not fetch deleted tracks and there are missing tracks
    // in the response (indicated by 'deleted' count), then there is no more content
    if (
      !newState.containsDeleted &&
      !isNaN(action.deleted) &&
      action.deleted > 0
    ) {
      newState.hasMore = false
    }

    // Hack alert:
    // For lineups with max entries (such as trending playlists) and deleted content,
    // manually set hasMore.
    //
    // Total entries is existing entries + deleted from both lineup & action
    const totalEntries =
      newState.entries.length +
      action.entries.length +
      newState.deleted +
      action.deleted
    if (newState.maxEntries !== null && totalEntries >= newState.maxEntries) {
      newState.hasMore = false
    }

    if (action.offset === 0) {
      newState.entries = action.entries
    } else {
      newState.entries = newState.entries.concat(action.entries)
    }
    newState.deleted += action.deleted || 0
    newState.entries.forEach((entry, i) => {
      if (!entry.uid) entry.uid = `${entry.id.toString()}-${i.toString()}`
    })
    newState.order = newState.entries.reduce((m, entry, i) => {
      m[entry.uid] = i
      return m
    }, {})
    return newState
  },
  [FETCH_LINEUP_METADATAS_FAILED](state, action) {
    const newState = { ...state }
    newState.status = Status.ERROR
    newState.isMetadataLoading = false
    newState.entries = []
    return newState
  },
  [UPDATE_LINEUP_ORDER](state, action) {
    const reorderedEntries = action.orderedIds.map(uid => ({
      ...state.entries[state.order[uid]]
    }))
    const newOrder = action.orderedIds.reduce((m, uid, i) => {
      m[uid] = i
      return m
    }, {})
    return {
      ...state,
      entries: reorderedEntries,
      order: newOrder
    }
  },
  [ADD](state, action) {
    const newState = { ...state }
    newState.entries = newState.entries.concat({
      ...action.entry
    })
    newState.order = { ...state.order }
    newState.order[action.entry.uid] = newState.entries.length
    return newState
  },
  [REMOVE](state, action) {
    const newState = { ...state }
    newState.entries = state.entries.filter(e => e.uid !== action.uid)

    const { [action.uid]: entryOrder, ...newOrder } = state.order
    Object.keys(newOrder).forEach(uid => {
      newOrder[uid] =
        newOrder[uid] > entryOrder ? newOrder[uid] - 1 : newOrder[uid]
    })
    newState.order = newOrder

    return newState
  },
  [SET_LOADING](state, action) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [SET_PAGE](state, action) {
    return {
      ...state,
      page: action.page
    }
  }
}

/**
 * Decorates a reducer with a higher order reducer, making it able to reduce on
 * lineup actions.
 * Decorated reducers should implement lineup actions with the LineupActions class.
 * @param {String} prefix the lineup reducer's prefix, e.g. "FEED"
 * @param {Function} reducer the reducer function to decorate
 */
export const asLineup = (prefix, reducer) => (state, action) => {
  const baseActionType = stripPrefix(prefix, action.type)
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return reducer(state, action)
  return matchingReduceFunction(state, action)
}
