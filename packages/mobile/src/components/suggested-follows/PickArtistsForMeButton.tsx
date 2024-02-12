import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
import { addFollowArtists } from 'common/store/pages/signon/actions'
import {
  getFollowIds,
  getSuggestedFollowIds
} from 'common/store/pages/signon/selectors'
import { sampleSize } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { IconWand } from '@audius/harmony-native'
import { TextButton } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  pickForMe: 'Pick Some For Me'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(4),
    justifyContent: 'center'
  }
}))

export const PickArtistsForMeButton = () => {
  const styles = useStyles()
  const followedArtistIds: ID[] = useSelector(getFollowIds)
  const suggestedArtistIds: ID[] = useSelector(getSuggestedFollowIds)
  const dispatch = useDispatch()

  // The autoselect or 'pick for me'
  // Selects the first three artists in the current category along with 2 additional
  // random artists from the top 10
  const handlePress = useCallback(() => {
    const selectedIds = new Set(followedArtistIds)
    const unselectedIds = suggestedArtistIds.filter(
      (artistId) => !selectedIds.has(artistId)
    )

    const firstThreeUserIds = unselectedIds.slice(0, 3)
    const remainingUserIds = unselectedIds.slice(3, 10)

    const newArtistsToFollow = firstThreeUserIds.concat(
      sampleSize(remainingUserIds, 2)
    )
    dispatch(addFollowArtists(newArtistsToFollow))
  }, [followedArtistIds, suggestedArtistIds, dispatch])

  return (
    <TextButton
      style={styles.root}
      variant='neutral'
      icon={IconWand}
      title={messages.pickForMe}
      activeUnderline
      onPress={handlePress}
    />
  )
}
