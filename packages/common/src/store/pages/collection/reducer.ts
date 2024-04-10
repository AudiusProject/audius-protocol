import snakecaseKeys from 'snakecase-keys'

import { Kind, SsrPageProps } from '~/models'
import { Collection } from '~/models/Collection'
import { makePlaylist } from '~/services/audius-api-client/ResponseAdapter'
import tracksReducer, {
  initialState as initialLineupState
} from '~/store/pages/collection/lineup/reducer'
import { makeUid } from '~/utils'

import { Status } from '../../../models/Status'
import { LineupActions, asLineup } from '../../../store/lineup/reducer'

import {
  FETCH_COLLECTION,
  FETCH_COLLECTION_SUCCEEDED,
  FETCH_COLLECTION_FAILED,
  RESET_COLLECTION,
  SET_SMART_COLLECTION,
  SET_IS_INITIAL_FETCH_AFTER_SSR,
  FetchCollectionSucceededAction,
  FetchCollectionFailedAction,
  CollectionPageAction,
  SetSmartCollectionAction,
  FetchCollectionAction,
  ResetCollectionAction,
  SetIsInitialFetchAfterSSRAction
} from './actions'
import { PREFIX as tracksPrefix } from './lineup/actions'
import { CollectionsPageState } from './types'

export const initialState = {
  collectionId: null,
  collectionUid: null,
  userUid: null,
  status: null,
  smartCollectionVariant: null,
  tracks: initialLineupState,
  collectionPermalink: null,
  isInitialFetchAfterSsr: false
}

const actionsMap = {
  [FETCH_COLLECTION](
    state: CollectionsPageState,
    _action: FetchCollectionAction
  ) {
    return {
      ...state,
      status: Status.LOADING,
      smartCollectionVariant: null
    }
  },
  [FETCH_COLLECTION_SUCCEEDED](
    state: CollectionsPageState,
    action: FetchCollectionSucceededAction
  ) {
    return {
      ...state,
      collectionId: action.collectionId,
      collectionUid: action.collectionUid,
      userUid: action.userUid,
      status: Status.SUCCESS,
      collectionPermalink: action.collectionPermalink
    }
  },
  [FETCH_COLLECTION_FAILED](
    state: CollectionsPageState,
    action: FetchCollectionFailedAction
  ) {
    return {
      ...state,
      userUid: action.userUid,
      status: Status.ERROR
    }
  },
  [RESET_COLLECTION](
    state: CollectionsPageState,
    _action: ResetCollectionAction
  ) {
    return {
      ...state,
      ...initialState
    }
  },
  [SET_SMART_COLLECTION](
    state: CollectionsPageState,
    action: SetSmartCollectionAction
  ) {
    return {
      ...state,
      smartCollectionVariant: action.smartCollectionVariant
    }
  },
  [SET_IS_INITIAL_FETCH_AFTER_SSR](
    state: CollectionsPageState,
    action: SetIsInitialFetchAfterSSRAction
  ) {
    return {
      ...state,
      isInitialFetchAfterSsr: action.isInitialFetchAfterSsr
    }
  }
}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const buildInitialState = (ssrPageProps?: SsrPageProps) => {
  // If we have preloaded data from the server, populate the initial
  // page state with it
  if (ssrPageProps?.collection) {
    // @ts-ignore
    const collection = makePlaylist(snakecaseKeys(ssrPageProps.collection))
    if (!collection) return initialState

    return {
      ...initialState,
      collectionId: collection.playlist_id,
      collectionUid: makeUid(Kind.COLLECTIONS, collection.playlist_id),
      userUid: makeUid(Kind.USERS, collection.user.user_id),
      status: Status.SUCCESS,
      collectionPermalink: collection.permalink,
      isInitialFetchAfterSsr: true
    }
  }
  return initialState
}

const reducer =
  (ssrPageProps?: SsrPageProps) =>
  (
    state: CollectionsPageState,
    action: CollectionPageAction | LineupActions<Collection>
  ) => {
    if (!state) {
      // @ts-ignore
      state = buildInitialState(ssrPageProps)
    }

    const updatedTracks = tracksLineupReducer(
      // @ts-ignore
      state.tracks,
      action as LineupActions<Collection>
    )
    if (updatedTracks !== state.tracks)
      return { ...state, tracks: updatedTracks }
    const matchingReduceFunction = actionsMap[action.type]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action as CollectionPageAction)
  }

export default reducer
