import { Reducer } from 'redux'

import { Status } from 'models/Status'
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

import { UID } from '../../models/Identifiers'
import { LineupState, LineupEntry, Order } from '../../models/Lineup'

export const initialLineupState = {
  prefix: '',
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
  nullCount: 0,
  status: Status.IDLE,
  hasMore: true,
  inView: false,
  // Boolean if the lineup should remove duplicate content in entries
  dedupe: false,
  // Boolean if the lineup fetch call pagination includes deleted tracks/collections
  // e.g. This should be true if we request 10 tracks but only get 9 back because
  // one is deleted
  // Whether the lineup is limited to a certain length
  maxEntries: null,
  // We save the payload of the last fetch call to re-use if not provided
  payload: undefined,
  // We save the handle of the last fetch call to re-use if not provided
  handle: undefined
}

type SetInViewAction = {
  type: typeof SET_IN_VIEW
  inView: boolean
}

type FetchLineupMetadatasRequestedAction = {
  type: typeof FETCH_LINEUP_METADATAS_REQUESTED
  limit: number
  offset: number
  handle: string
  payload: unknown
}

type FetchLineupMetadatasSucceededAction<T> = {
  type: typeof FETCH_LINEUP_METADATAS_SUCCEEDED
  entries: LineupEntry<T>[]
  deleted: number
  nullCount: number
  limit: number
  offset: number
}

type FetchLineupMetadatasFailedAction = {
  type: typeof FETCH_LINEUP_METADATAS_FAILED
}

type UpdateLineupOrderAction = {
  type: typeof UPDATE_LINEUP_ORDER
  orderedIds: UID[]
}

type AddAction<T> = {
  type: typeof ADD
  entry: LineupEntry<T>
  shouldPrepend?: boolean
}

type RemoveAction = {
  type: typeof REMOVE
  uid: UID
}

type SetLoadingAction = {
  type: typeof SET_LOADING
}

type SetPageAction = {
  type: typeof SET_PAGE
  page: number
}

export type LineupActions<T> =
  | SetInViewAction
  | FetchLineupMetadatasRequestedAction
  | FetchLineupMetadatasSucceededAction<T>
  | FetchLineupMetadatasFailedAction
  | UpdateLineupOrderAction
  | AddAction<T>
  | RemoveAction
  | SetLoadingAction
  | SetPageAction

export const actionsMap = {
  [SET_IN_VIEW]<T>(state: LineupState<T>, action: SetInViewAction) {
    return {
      ...state,
      inView: action.inView
    }
  },
  [FETCH_LINEUP_METADATAS_REQUESTED]<T>(
    state: LineupState<T>,
    action: FetchLineupMetadatasRequestedAction
  ) {
    const newState = { ...state }
    if (action.offset === 0) newState.entryIds = new Set([])
    newState.total = action.limit + action.offset
    newState.status = Status.LOADING
    newState.isMetadataLoading = true
    if (action.payload) {
      newState.payload = action.payload
    }
    if (action.handle) {
      newState.handle = action.handle
    }
    return newState
  },
  [FETCH_LINEUP_METADATAS_SUCCEEDED]<T>(
    state: LineupState<T>,
    action: FetchLineupMetadatasSucceededAction<T>
  ) {
    const newState = { ...state }
    newState.isMetadataLoading = false
    newState.status = Status.SUCCESS
    newState.hasMore = action.entries.length + action.deleted >= action.limit

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
    newState.deleted += Math.max(action.deleted || 0, 0)
    newState.nullCount += Math.max(action.nullCount || 0, 0)
    newState.entries.forEach((entry, i) => {
      if (!entry.uid) entry.uid = `${entry.id.toString()}-${i.toString()}`
    })
    newState.order = newState.entries.reduce<Order>((m, entry, i) => {
      m[entry.uid] = i
      return m
    }, {})
    return newState
  },
  [FETCH_LINEUP_METADATAS_FAILED]<T>(
    state: LineupState<T>,
    _action: FetchLineupMetadatasFailedAction
  ) {
    const newState = { ...state }
    newState.status = Status.ERROR
    newState.isMetadataLoading = false
    newState.entries = []
    return newState
  },
  [UPDATE_LINEUP_ORDER]<T>(
    state: LineupState<T>,
    action: UpdateLineupOrderAction
  ) {
    const reorderedEntries = action.orderedIds.map((uid) => ({
      ...state.entries[state.order[uid]]
    }))
    const newOrder = action.orderedIds.reduce<Order>((m, uid, i) => {
      m[uid] = i
      return m
    }, {})
    return {
      ...state,
      entries: reorderedEntries,
      order: newOrder
    }
  },
  [ADD]<T>(state: LineupState<T>, action: AddAction<T>) {
    const { entry, shouldPrepend } = action
    const newState = { ...state }
    newState.order = { ...state.order }

    if (shouldPrepend) {
      newState.entries = [entry, ...newState.entries]
      newState.entries.forEach((newEntry, index) => {
        newState.order[newEntry.uid] = index
      })
    } else {
      newState.entries = newState.entries.concat({
        ...entry
      })
      newState.order[entry.uid] = newState.entries.length
    }
    return newState
  },
  [REMOVE]<T>(state: LineupState<T>, action: RemoveAction) {
    const newState = { ...state }
    newState.entries = state.entries.filter((e) => e.uid !== action.uid)

    const { [action.uid]: entryOrder, ...newOrder } = state.order
    Object.keys(newOrder).forEach((uid) => {
      newOrder[uid] =
        newOrder[uid] > entryOrder ? newOrder[uid] - 1 : newOrder[uid]
    })
    newState.order = newOrder

    return newState
  },
  [SET_LOADING]<T>(state: LineupState<T>, _action: SetLoadingAction) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [SET_PAGE]<T>(state: LineupState<T>, action: SetPageAction) {
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
export const asLineup =
  <
    EntryT,
    LineupStateType extends LineupState<EntryT>,
    LineupActionType extends { type: string }
  >(
    prefix: string,
    reducer: (
      state: LineupStateType | undefined,
      action: LineupActionType
    ) => LineupStateType
  ): Reducer<LineupStateType, LineupActionType | LineupActions<EntryT>> =>
  (
    state: LineupStateType | undefined,
    action: LineupActionType | LineupActions<EntryT>
  ): LineupStateType => {
    if (!action.type.startsWith(prefix)) {
      return reducer(state, action as LineupActionType)
    }
    const baseActionType = stripPrefix(
      prefix,
      action.type
    ) as LineupActions<EntryT>['type']
    const matchingReduceFunction = actionsMap[baseActionType]
    if (!matchingReduceFunction)
      return reducer(state, action as LineupActionType)
    // @ts-ignore action is never for some reason, ts 4.1 may help here
    return matchingReduceFunction(state, action as LineupActions<EntryT>)
  }
