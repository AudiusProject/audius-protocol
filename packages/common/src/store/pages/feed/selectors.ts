import { CommonState } from '~/store/commonStore'

export const getDiscoverFeedLineup = (state: CommonState) =>
  state.pages.feed.feed

export const getFeedFilter = (state: CommonState) => state.pages.feed.feedFilter
