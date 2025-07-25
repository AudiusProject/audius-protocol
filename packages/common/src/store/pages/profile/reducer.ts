import { LineupActions, asLineup } from '~/store/lineup/reducer'
import feedReducer, {
  initialState as initialFeedLineupState
} from '~/store/pages/profile/lineups/feed/reducer'
import tracksReducer, {
  initialState as initialTracksLineupState
} from '~/store/pages/profile/lineups/tracks/reducer'

import { Collection, Status, Track } from '../../../models'

import {
  FETCH_PROFILE,
  FETCH_PROFILE_SUCCEEDED,
  FETCH_PROFILE_FAILED,
  UPDATE_PROFILE,
  UPDATE_PROFILE_SUCCEEDED,
  UPDATE_PROFILE_FAILED,
  UPDATE_COLLECTION_SORT_MODE,
  SET_PROFILE_FIELD,
  DISMISS_PROFILE_METER,
  SET_CURRENT_USER,
  FetchProfileAction,
  FetchProfileSucceededAction,
  SetCurrentUserAction,
  SetProfileFieldAction,
  FetchProfileFailedAction,
  UpdateProfileAction,
  UpdateProfileSucceededAction,
  UpdateProfileFailedAction,
  UpdateCollectionSortModeAction,
  DismissProfileMeterAction,
  ProfilePageAction
} from './actions'
import { PREFIX as feedPrefix } from './lineups/feed/actions'
import { PREFIX as tracksPrefix } from './lineups/tracks/actions'
import { CollectionSortMode, ProfilePageState, ProfileState } from './types'

const initialProfileState = {
  handle: null,
  userId: null,
  status: Status.IDLE,

  updating: false,
  updateSuccess: false,
  updateError: false,

  collectionSortMode: CollectionSortMode.TIMESTAMP,

  profileMeterDismissed: false,

  feed: initialFeedLineupState,
  tracks: initialTracksLineupState
}

const updateProfile = (
  state: ProfilePageState,
  action: ProfilePageAction,
  data: Partial<ProfileState>
) => {
  const { currentUser, entries } = state
  const profileHandle =
    ('handle' in action && action.handle?.toLowerCase()) || currentUser
  const newEntry = profileHandle ? entries[profileHandle] : {}

  const newEntryData = profileHandle
    ? {
        [profileHandle]: {
          ...newEntry,
          ...data
        }
      }
    : {}

  return {
    ...state,
    entries: { ...entries, ...newEntryData }
  }
}

const initialState = {
  currentUser: null,
  entries: {}
}

const actionsMap = {
  [FETCH_PROFILE](state: ProfilePageState, action: FetchProfileAction) {
    const { fetchOnly, shouldSetLoading, handle, userId } = action
    if (fetchOnly) return state
    const lowerHandle = handle?.toLowerCase()

    const newState: Partial<ProfileState> = {}

    if (shouldSetLoading) {
      newState.status = Status.LOADING
    }
    if (handle) {
      newState.handle = lowerHandle
    }
    if (userId) {
      newState.userId = userId
    }
    return {
      ...updateProfile(state, action, newState),
      currentUser: lowerHandle
    }
  },
  [FETCH_PROFILE_SUCCEEDED](
    state: ProfilePageState,
    action: FetchProfileSucceededAction
  ) {
    const { currentUser } = state
    const { fetchOnly, userId, handle } = action
    const profileHandle = handle?.toLowerCase() ?? currentUser
    if (fetchOnly) return state

    return updateProfile(state, action, {
      status: Status.SUCCESS,
      userId,
      handle: profileHandle
    })
  },
  [FETCH_PROFILE_FAILED](
    state: ProfilePageState,
    action: FetchProfileFailedAction
  ) {
    return updateProfile(state, action, { status: Status.ERROR })
  },
  [SET_CURRENT_USER](state: ProfilePageState, action: SetCurrentUserAction) {
    const { handle } = action
    const lowerHandle = handle?.toLowerCase()

    return {
      ...state,
      currentUser: lowerHandle
    }
  },
  [SET_PROFILE_FIELD](state: ProfilePageState, action: SetProfileFieldAction) {
    const { field, value } = action
    return updateProfile(state, action, { [field]: value })
  },
  [UPDATE_PROFILE](state: ProfilePageState, action: UpdateProfileAction) {
    return updateProfile(state, action, {
      updating: true,
      updateSuccess: false,
      updateError: false
    })
  },
  [UPDATE_PROFILE_SUCCEEDED](
    state: ProfilePageState,
    action: UpdateProfileSucceededAction
  ) {
    return updateProfile(state, action, {
      updating: false,
      updateSuccess: true
    })
  },
  [UPDATE_PROFILE_FAILED](
    state: ProfilePageState,
    action: UpdateProfileFailedAction
  ) {
    return updateProfile(state, action, {
      updating: false,
      updateError: true
    })
  },
  [UPDATE_COLLECTION_SORT_MODE](
    state: ProfilePageState,
    action: UpdateCollectionSortModeAction
  ) {
    const { mode } = action
    return updateProfile(state, action, { collectionSortMode: mode })
  },
  [DISMISS_PROFILE_METER](
    state: ProfilePageState,
    action: DismissProfileMeterAction
  ) {
    return updateProfile(state, action, { profileMeterDismissed: true })
  }
}

const feedLineupReducer = asLineup(feedPrefix, feedReducer)
const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (
  state: ProfilePageState,
  action:
    | ProfilePageAction
    | LineupActions<Track>
    | LineupActions<Track | Collection>
) => {
  if (!state) {
    state = initialState
  }

  // profile state with the user from ssr
  const { currentUser, entries } = state

  const profileHandle =
    'handle' in action && typeof action.handle === 'string'
      ? action.handle.toLowerCase()
      : currentUser
  if (!profileHandle) return state

  let newEntry = entries[profileHandle] ?? initialProfileState

  const feed = feedLineupReducer(
    newEntry.feed,
    action as LineupActions<Track | Collection>
  )
  if (feed !== newEntry.feed) {
    newEntry = { ...newEntry, feed }
  }

  const tracks = tracksLineupReducer(
    // @ts-ignore
    newEntry.tracks,
    action as LineupActions<Track>
  )
  if (tracks !== newEntry.tracks) {
    newEntry = { ...newEntry, tracks }
  }

  const newState = {
    ...state,
    entries: { ...entries, [profileHandle]: newEntry }
  }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return newState
  return matchingReduceFunction(newState, action as ProfilePageAction)
}

export default reducer
