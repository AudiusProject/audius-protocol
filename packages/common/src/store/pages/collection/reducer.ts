import { Collection } from '~/models/Collection'
import tracksReducer, {
  initialState as initialLineupState
} from '~/store/pages/collection/lineup/reducer'

import { Status } from '../../../models/Status'
import { LineupActions, asLineup } from '../../../store/lineup/reducer'

import {
  FETCH_COLLECTION,
  FETCH_COLLECTION_SUCCEEDED,
  FETCH_COLLECTION_FAILED,
  RESET_COLLECTION,
  FetchCollectionSucceededAction,
  FetchCollectionFailedAction,
  CollectionPageAction,
  FetchCollectionAction,
  ResetCollectionAction
} from './actions'
import { PREFIX as tracksPrefix } from './lineup/actions'
import { CollectionsPageState } from './types'

export const initialState = {
  collectionId: null,
  userUid: null,
  status: null,
  tracks: initialLineupState,
  collectionPermalink: null
}

const actionsMap = {
  [FETCH_COLLECTION](
    state: CollectionsPageState,
    _action: FetchCollectionAction
  ) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_COLLECTION_SUCCEEDED](
    state: CollectionsPageState,
    action: FetchCollectionSucceededAction
  ) {
    return {
      ...state,
      collectionId: action.collectionId,
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
  }
}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (
  state: CollectionsPageState,
  action: CollectionPageAction | LineupActions<Collection>
) => {
  if (!state) {
    // @ts-ignore
    state = initialState
  }

  const updatedTracks = tracksLineupReducer(
    // @ts-ignore
    state.tracks,
    action as LineupActions<Collection>
  )
  if (updatedTracks !== state.tracks) return { ...state, tracks: updatedTracks }
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action as CollectionPageAction)
}

export default reducer
