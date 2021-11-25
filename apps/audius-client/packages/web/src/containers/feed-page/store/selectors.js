import { getUsers } from 'common/store/cache/users/selectors'
import { createShallowSelector } from 'utils/selectorHelpers'

export const getSuggestedFollows = state => state.feed.suggestedFollows
export const getDiscoverFeedLineup = state => state.feed.feed

export const getFeedFilter = state => state.feed.feedFilter

export const getSuggestedFollowUsers = state =>
  getUsers(state, { ids: getSuggestedFollows(state) })

export const makeGetSuggestedFollows = () => {
  return createShallowSelector(
    [getSuggestedFollowUsers, getSuggestedFollows],
    (users, followIds) => {
      return followIds
        .map(id => users[id])
        .filter(user => !!user && !user.is_deactivated)
    }
  )
}
