import Status from 'common/models/Status'
import { asLineup } from 'common/store/lineup/reducer'
import feedReducer from 'common/store/pages/profile/lineups/feed/reducer'
import tracksReducer from 'common/store/pages/profile/lineups/tracks/reducer'
import {
  FollowType,
  CollectionSortMode
} from 'common/store/pages/profile/types'
import {
  FOLLOW_USER,
  FOLLOW_USER_FAILED
} from 'common/store/social/users/actions'

import {
  FETCH_PROFILE,
  FETCH_PROFILE_SUCCEEDED,
  FETCH_PROFILE_FAILED,
  UPDATE_PROFILE,
  UPDATE_PROFILE_SUCCEEDED,
  UPDATE_PROFILE_FAILED,
  RESET_PROFILE,
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

const initialState = {
  handle: null,
  userId: null,
  status: Status.LOADING,

  isNotificationSubscribed: false,
  updating: false,
  updateSuccess: false,
  updateError: false,
  mostUsedTags: [],

  collectionSortMode: CollectionSortMode.SAVE_COUNT,

  profileMeterDismissed: false,

  [FollowType.FOLLOWERS]: { status: Status.LOADING, userIds: [] },
  [FollowType.FOLLOWEES]: { status: Status.LOADING, userIds: [] },
  [FollowType.FOLLOWEE_FOLLOWS]: { status: Status.LOADING, userIds: [] }
}

const actionsMap = {
  [FETCH_PROFILE](state, action) {
    if (action.fetchOnly) return state

    const newState = {
      ...state,
      status: action.shouldSetLoading ? Status.LOADING : state.status
    }
    if (action.handle) {
      newState.handle = action.handle
    }
    if (action.userId) {
      newState.userId = action.userId
    }
    return newState
  },
  [FETCH_PROFILE_SUCCEEDED](state, action) {
    if (action.fetchOnly) return state

    return {
      ...state,
      status: Status.SUCCESS,
      userId: action.userId,
      handle: action.handle
    }
  },
  [FETCH_FOLLOW_USERS](state, action) {
    return {
      ...state,
      [action.followerGroup]: {
        ...state[action.followerGroup],
        status: Status.LOADING
      }
    }
  },
  [FETCH_FOLLOW_USERS_SUCCEEDED](state, action) {
    const filteredAddedUserIds = action.userIds.filter(({ id }) =>
      state[action.followerGroup].userIds.every(
        ({ id: userId }) => id !== userId
      )
    )
    return {
      ...state,
      [action.followerGroup]: {
        userIds:
          state[action.followerGroup].userIds.concat(filteredAddedUserIds),
        status: Status.SUCCESS
      }
    }
  },
  [FETCH_FOLLOW_USERS_FAILED](state, action) {
    return {
      ...state,
      [action.followerGroup]: {
        ...state[action.followerGroup],
        status: Status.ERROR
      }
    }
  },
  [SET_PROFILE_FIELD](state, action) {
    return {
      ...state,
      [action.field]: action.value
    }
  },
  [FETCH_PROFILE_FAILED](state, action) {
    return {
      ...state,
      status: Status.ERROR
    }
  },
  [UPDATE_MOST_USED_TAGS](state, action) {
    return {
      ...state,
      mostUsedTags: action.mustUsedTags
    }
  },
  [UPDATE_PROFILE](state, action) {
    return {
      ...state,
      updating: true
    }
  },
  [UPDATE_PROFILE_SUCCEEDED](state, action) {
    return {
      ...state,
      updating: false,
      updateSuccess: true
    }
  },
  [UPDATE_PROFILE_FAILED](state, action) {
    return {
      ...state,
      updating: false,
      updateError: true
    }
  },
  [RESET_PROFILE](state, action) {
    return {
      ...initialState,
      profileMeterDismissed: state.profileMeterDismissed,
      feed: feedLineupReducer(undefined, action),
      tracks: tracksLineupReducer(undefined, action)
    }
  },
  [UPDATE_COLLECTION_SORT_MODE](state, action) {
    return {
      ...state,
      collectionSortMode: action.mode
    }
  },
  [DISMISS_PROFILE_METER](state, action) {
    return {
      ...state,
      profileMeterDismissed: true
    }
  },
  [FOLLOW_USER](state, action) {
    return {
      ...state,
      [FollowType.FOLLOWEES]: {
        ...state[FollowType.FOLLOWEES],
        userIds: state[FollowType.FOLLOWEES].userIds.concat([action.userId])
      }
    }
  },
  [FOLLOW_USER_FAILED](state, action) {
    return {
      ...state,
      [FollowType.FOLLOWEES]: {
        ...state[FollowType.FOLLOWEES],
        userIds: state[FollowType.FOLLOWEES].userIds.filter(
          (id) => id !== action.userId
        )
      }
    }
  },
  [SET_NOTIFICATION_SUBSCRIPTION](state, action) {
    return {
      ...state,
      isNotificationSubscribed: action.isSubscribed
    }
  }
}

const feedLineupReducer = asLineup(feedPrefix, feedReducer)
const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (state = initialState, action) => {
  const feed = feedLineupReducer(state.feed, action)
  if (feed !== state.feed) return { ...state, feed }

  const tracks = tracksLineupReducer(state.tracks, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
