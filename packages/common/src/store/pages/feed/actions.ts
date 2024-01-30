import { FeedFilter } from 'models/FeedFilter'
import { ID } from 'models/Identifiers'

export const FETCH_SUGGESTED_FOLLOW_USERS = 'FEED/FETCH_SUGGESTED_FOLLOW_USERS'
export const FOLLOW_USERS = 'FEED/FOLLOW_USERS'
export const SET_SUGGESTED_FOLLOWS = 'FEED/SET_SUGGESTED_FOLLOWS'
export const SET_FEED_FILTER = 'FEED/SET_FEED_FILTER'

export type FetchSuggestedFollowUsersAction = {
  type: typeof FETCH_SUGGESTED_FOLLOW_USERS
}

export type FollowUsersAction = {
  type: typeof FOLLOW_USERS
  userIds: ID[]
}

export type SetSuggestedFollowsAction = {
  type: typeof SET_SUGGESTED_FOLLOWS
  userIds: ID[]
}

export type SetFeedFilterAction = {
  type: typeof SET_FEED_FILTER
  filter: FeedFilter
}

export type FeedPageAction =
  | FetchSuggestedFollowUsersAction
  | FollowUsersAction
  | SetSuggestedFollowsAction
  | SetFeedFilterAction

export const fetchSuggestedFollowUsers =
  (): FetchSuggestedFollowUsersAction => ({
    type: FETCH_SUGGESTED_FOLLOW_USERS
  })

export const followUsers = (userIds: ID[]): FollowUsersAction => ({
  type: FOLLOW_USERS,
  userIds
})

export const setSuggestedFollows = (
  userIds: ID[]
): SetSuggestedFollowsAction => ({
  type: SET_SUGGESTED_FOLLOWS,
  userIds
})

export const setFeedFilter = (filter: FeedFilter): SetFeedFilterAction => ({
  type: SET_FEED_FILTER,
  filter
})
