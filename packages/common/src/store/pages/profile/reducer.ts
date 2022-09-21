// @ts-nocheck
// TODO(nkang) - convert to TS
import { update } from 'lodash'

import { asLineup } from 'store/lineup/reducer'
import feedReducer from 'store/pages/profile/lineups/feed/reducer'
import tracksReducer from 'store/pages/profile/lineups/tracks/reducer'
import { FollowType, CollectionSortMode } from 'store/pages/profile/types'
import { FOLLOW_USER, FOLLOW_USER_FAILED } from 'store/social/users/actions'

import { Status } from '../../../models'

import {
  FETCH_PROFILE,
  FETCH_PROFILE_SUCCEEDED,
  FETCH_PROFILE_FAILED,
  UPDATE_PROFILE,
  UPDATE_PROFILE_SUCCEEDED,
  UPDATE_PROFILE_FAILED,
  UPDATE_COLLECTION_SORT_MODE,
  SET_PROFILE_FIELD,
  FETCH_FOLLOW_USERS,
  FETCH_FOLLOW_USERS_SUCCEEDED,
  FETCH_FOLLOW_USERS_FAILED,
  DISMISS_PROFILE_METER,
  UPDATE_MOST_USED_TAGS,
  SET_NOTIFICATION_SUBSCRIPTION
} from './actions'
import { PREFIX as feedPrefix } from './lineups/feed/actions'
import { PREFIX as tracksPrefix } from './lineups/tracks/actions'

const initialProfileState = {
  handle: null,
  userId: null,
  status: Status.IDLE,

  isNotificationSubscribed: false,
  updating: false,
  updateSuccess: false,
  updateError: false,
  mostUsedTags: [],

  collectionSortMode: CollectionSortMode.SAVE_COUNT,

  profileMeterDismissed: false,

  [FollowType.FOLLOWERS]: { status: Status.IDLE, userIds: [] },
  [FollowType.FOLLOWEES]: { status: Status.IDLE, userIds: [] },
  [FollowType.FOLLOWEE_FOLLOWS]: { status: Status.IDLE, userIds: [] }
}

const updateProfile = (state, action, data) => {
  const { currentUser, entries } = state
  const { handle } = action
  const profileHandle = handle ?? currentUser
  const newEntry = entries[profileHandle]

  return {
    ...state,
    entries: {
      ...entries,
      [profileHandle]: {
        ...newEntry,
        ...data
      }
    }
  }
}

const initialState = { currentUser: null, entries: {} }

const actionsMap = {
  [FETCH_PROFILE](state, action) {
    const { fetchOnly, shouldSetLoading, handle, userId } = action
    if (fetchOnly) return state

    const newState = {
      status: shouldSetLoading ? Status.LOADING : state.status
    }
    if (handle) {
      newState.handle = handle
    }
    if (userId) {
      newState.userId = userId
    }
    return {
      ...updateProfile(state, action, newState),
      currentUser: handle
    }
  },
  [FETCH_PROFILE_SUCCEEDED](state, action) {
    const { currentUser } = state
    const { fetchOnly, userId, handle } = action
    const profileHandle = handle ?? currentUser
    if (fetchOnly) return state

    return updateProfile(state, action, {
      status: Status.SUCCESS,
      userId,
      handle: profileHandle
    })
  },
  [FETCH_FOLLOW_USERS](state, action) {
    const { currentUser, entries } = state
    const { followerGroup, handle } = action
    const profileHandle = handle ?? currentUser
    const newEntry = entries[profileHandle]

    return {
      ...state,
      entries: {
        ...entries,
        [profileHandle]: {
          ...newEntry,
          [followerGroup]: {
            ...newEntry[followerGroup],
            status: Status.LOADING
          }
        }
      }
    }
  },
  [FETCH_FOLLOW_USERS_SUCCEEDED](state, action) {
    const { currentUser, entries } = state
    const { userIds, followerGroup, handle } = action
    const profileHandle = handle ?? currentUser
    const filteredAddedUserIds = userIds.filter(({ id }) =>
      state[followerGroup].userIds.every(({ id: userId }) => id !== userId)
    )

    const newEntry = entries[profileHandle]

    return {
      ...state,
      entries: {
        ...entries,
        [profileHandle]: {
          ...newEntry,
          [followerGroup]: {
            userIds:
              newEntry[followerGroup].userIds.concat(filteredAddedUserIds),
            status: Status.SUCCESS
          }
        }
      }
    }
  },
  [FETCH_FOLLOW_USERS_FAILED](state, action) {
    const { currentUser, entries } = state
    const { followerGroup, handle } = action
    const profileHandle = handle ?? currentUser
    const newEntry = entries[profileHandle]

    return {
      ...state,
      entries: {
        [profileHandle]: {
          ...newEntry,
          [followerGroup]: {
            ...newEntry[followerGroup],
            status: Status.ERROR
          }
        }
      }
    }
  },
  [SET_PROFILE_FIELD](state, action) {
    const { field, value } = action
    return updateProfile(state, action, { [field]: value })
  },
  [FETCH_PROFILE_FAILED](state, action) {
    return updateProfile(state, action, { status: Status.ERROR })
  },
  [UPDATE_MOST_USED_TAGS](state, action) {
    const { mostUsedTags } = action
    return updateProfile(state, action, { mostUsedTags })
  },
  [UPDATE_PROFILE](state, action) {
    return updateProfile(state, action, { updating: true })
  },
  [UPDATE_PROFILE_SUCCEEDED](state, action) {
    return updateProfile(state, action, {
      updating: false,
      updateSuccess: true
    })
  },
  [UPDATE_PROFILE_FAILED](state, action) {
    return updateProfile(state, action, {
      updating: false,
      updateError: true
    })
  },
  [UPDATE_COLLECTION_SORT_MODE](state, action) {
    const { mode } = action
    return updateProfile(state, action, { collectionSortMode: mode })
  },
  [DISMISS_PROFILE_METER](state, action) {
    return updateProfile(state, action, { profileMeterDismissed: true })
  },
  [FOLLOW_USER](state, action) {
    const { currentUser, entries } = state
    const { handle, userId } = action
    const profileHandle = handle ?? currentUser
    const newEntry = entries[profileHandle]
    const profileFollowees = newEntry[FollowType.FOLLOWEES]

    return {
      ...state,
      entries: {
        ...entries,
        [profileHandle]: {
          ...newEntry,
          [FollowType.FOLLOWEES]: {
            ...profileFollowees,
            userIds: profileFollowees.userIds.concat([userId])
          }
        }
      }
    }
  },
  [FOLLOW_USER_FAILED](state, action) {},
  [SET_NOTIFICATION_SUBSCRIPTION](state, action) {
    const { isSubscribed } = action

    return updateProfile(state, action, {
      isNotificationSubscribed: isSubscribed
    })
  }
}

const feedLineupReducer = asLineup(feedPrefix, feedReducer)
const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (state = initialState, action) => {
  const { currentUser, entries } = state
  const { handle } = action

  const profileHandle = handle ?? currentUser
  if (!profileHandle) return state

  let newEntry = entries[profileHandle] ?? initialProfileState

  const feed = feedLineupReducer(newEntry.feed, action)
  if (feed !== newEntry.feed) {
    newEntry = { ...newEntry, feed }
  }

  const tracks = tracksLineupReducer(newEntry.tracks, action)
  if (tracks !== newEntry.tracks) {
    newEntry = { ...newEntry, tracks }
  }

  const newState = {
    ...state,
    entries: { ...entries, [profileHandle]: newEntry }
  }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return newState
  return matchingReduceFunction(newState, action)
}

export default reducer
