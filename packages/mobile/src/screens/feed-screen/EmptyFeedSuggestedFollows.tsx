import {
  feedPageLineupActions as feedActions,
  feedPageActions
} from '@audius/common/store'
import { useCallback } from 'react'

import * as signOnActions from 'common/store/pages/signon/actions'
import { Dimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { SuggestedFollows } from 'app/components/suggested-follows'
import type { AppState } from 'app/store'

const { height } = Dimensions.get('window')

const messages = {
  emptyFeed: `Oops! There's nothing here.`
}

export const EmptyFeedSuggestedFollows = () => {
  const dispatch = useDispatch()

  const selectedUserIds = useSelector(
    (state: AppState) => state.signOn.followArtists.selectedUserIds
  )
  const handleArtistsSelected = useCallback(() => {
    // Set eager users and refetch lineup
    dispatch(signOnActions.followArtists(selectedUserIds))
    dispatch(feedActions.fetchLineupMetadatas())
    // Async go follow users
    dispatch(feedPageActions.followUsers(selectedUserIds))
  }, [dispatch, selectedUserIds])

  return (
    <SuggestedFollows
      style={{ height: height - 220 }}
      title={messages.emptyFeed}
      onArtistsSelected={handleArtistsSelected}
      screen='feed'
    />
  )
}
