import { getUsers } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'

export const getSuggestedFollows = (state: CommonState) =>
  state.pages.feed.suggestedFollows
export const getDiscoverFeedLineup = (state: CommonState) =>
  state.pages.feed.feed

export const getFeedFilter = (state: CommonState) => state.pages.feed.feedFilter

export const getSuggestedFollowUsers = (state: CommonState) =>
  getUsers(state, { ids: getSuggestedFollows(state) })
