import { Fragment, useCallback, useEffect, useState } from 'react'

import { useRelatedArtists } from '@audius/common/api'
import { FollowSource } from '@audius/common/models'
import type { ID, User } from '@audius/common/models'
import { cacheUsersSelectors, usersSocialActions } from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import { css } from '@emotion/native'
import { isEmpty } from 'lodash'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import {
  IconUserFollow,
  IconUserFollowing,
  IconClose,
  useTheme,
  IconButton,
  Button
} from '@audius/harmony-native'
import { Text, ProfilePicture } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { track, make } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'

import { useSelectProfile } from '../selectors'

import { ArtistLink } from './ArtistLink'
const { getUsers } = cacheUsersSelectors
const { followUser, unfollowUser } = usersSocialActions

const messages = {
  description: 'Here are some accounts that vibe well with',
  followAll: 'Follow All',
  followingAll: 'Following All',
  closeLabel: 'Close'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    paddingHorizontal: spacing(3),
    marginHorizontal: spacing(-3),
    marginBottom: spacing(2),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  header: {
    flexDirection: 'row'
  },
  description: {
    flexShrink: 1
  },
  dismissButton: {
    marginRight: spacing(2)
  },
  suggestedArtistsPhotos: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing(2)
  },
  suggestedArtistsText: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing(2)
  }
}))

type ArtistRecommendationsProps = {
  onClose: () => void
}

export const ArtistRecommendations = (props: ArtistRecommendationsProps) => {
  const { onClose } = props
  const styles = useStyles()
  const { spacing } = useTheme()
  const navigation = useNavigation()
  const { user_id, name } = useSelectProfile(['user_id', 'name'])

  const dispatch = useDispatch()

  useEffectOnce(() => {
    track(
      make({
        eventName: EventNames.PROFILE_PAGE_SHOWN_ARTIST_RECOMMENDATIONS,
        userId: user_id
      })
    )
  })

  const [idsToFollow, setIdsToFollow] = useState<ID[] | null>(null)
  const artistsToFollow = useSelector<CommonState, User[]>((state) =>
    Object.values(getUsers(state, { ids: idsToFollow || [] }))
  )

  const { data: suggestedArtists } = useRelatedArtists({
    artistId: user_id,
    filterFollowed: true
  })

  useEffect(() => {
    if (suggestedArtists && !isEmpty(suggestedArtists)) {
      setIdsToFollow(suggestedArtists.map((user) => user.user_id))
    }
  }, [suggestedArtists])

  const isFollowingAllArtists = artistsToFollow.every(
    (artist) => artist.does_current_user_follow
  )

  const handlePressFollow = useCallback(() => {
    artistsToFollow.forEach((artist) => {
      if (isFollowingAllArtists) {
        dispatch(
          unfollowUser(
            artist.user_id,
            FollowSource.ARTIST_RECOMMENDATIONS_POPUP
          )
        )
      } else {
        dispatch(
          followUser(artist.user_id, FollowSource.ARTIST_RECOMMENDATIONS_POPUP)
        )
      }
    })
  }, [artistsToFollow, isFollowingAllArtists, dispatch])

  const handlePressArtist = useCallback(
    (artist: User) => () => {
      navigation.push('Profile', { handle: artist.handle })
    },
    [navigation]
  )

  const suggestedArtistNames = artistsToFollow.slice(0, 3)

  if (artistsToFollow.length === 0) {
    return null
  }

  return (
    <View pointerEvents='box-none' style={styles.root}>
      <View style={styles.header} pointerEvents='box-none'>
        <IconButton
          icon={IconClose}
          style={styles.dismissButton}
          color='subdued'
          aria-label={messages.closeLabel}
          onPress={onClose}
        />
        <View pointerEvents='none' style={styles.description}>
          <Text variant='body1'>
            {messages.description} {name}
          </Text>
        </View>
      </View>
      <View style={styles.suggestedArtistsPhotos} pointerEvents='box-none'>
        {artistsToFollow.map((artist) => (
          <TouchableOpacity
            onPress={handlePressArtist(artist)}
            key={artist.user_id}
          >
            <ProfilePicture
              userId={artist.user_id}
              style={css({
                height: spacing.unit13,
                width: spacing.unit13,
                marginRight: -spacing.s
              })}
              borderWidth='thin'
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.suggestedArtistsText} pointerEvents='box-none'>
        <View pointerEvents='none'>
          <Text variant='body1'>Featuring </Text>
        </View>
        {suggestedArtistNames.map((artist) => (
          <Fragment key={artist.user_id}>
            <ArtistLink artist={artist} onPress={handlePressArtist(artist)} />
            <Text variant='body1'>, </Text>
          </Fragment>
        ))}
        <View pointerEvents='none'>
          <Text variant='body1'>{`and ${
            artistsToFollow.length - suggestedArtistNames.length
          } others`}</Text>
        </View>
      </View>
      <Button
        variant='primary'
        iconLeft={isFollowingAllArtists ? IconUserFollowing : IconUserFollow}
        fullWidth
        onPress={handlePressFollow}
      >
        {isFollowingAllArtists ? messages.followingAll : messages.followAll}
      </Button>
    </View>
  )
}
