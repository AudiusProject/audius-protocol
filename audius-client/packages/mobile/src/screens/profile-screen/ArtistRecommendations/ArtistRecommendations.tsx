import { Fragment, useCallback } from 'react'

import { FollowSource } from 'audius-client/src/common/models/Analytics'
import { User } from 'audius-client/src/common/models/User'
import {
  followUser,
  unfollowUser
} from 'audius-client/src/common/store/social/users/actions'
import { makeGetRelatedArtists } from 'audius-client/src/common/store/ui/artist-recommendations/selectors'
import { fetchRelatedArtists } from 'audius-client/src/common/store/ui/artist-recommendations/slice'
import { View } from 'react-native'
import { useEffectOnce } from 'react-use'

import IconFollow from 'app/assets/images/iconFollow.svg'
import IconFollowing from 'app/assets/images/iconFollowing.svg'
import IconClose from 'app/assets/images/iconRemove.svg'
import { Button, IconButton, Text } from 'app/components/core'
import { ProfilePhoto } from 'app/components/user'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { track, make } from 'app/utils/analytics'

import { EventNames } from '../../../types/analytics'

import { ArtistLink } from './ArtistLink'

const messages = {
  description: 'Here are some accounts that vibe well with',
  followAll: 'Follow All',
  followingAll: 'Following All'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    padding: spacing(2)
  },
  header: {
    flexDirection: 'row'
  },
  dismissButton: {
    marginRight: spacing(4)
  },
  dismissIcon: {
    height: 24,
    width: 24,
    fill: palette.neutralLight4
  },
  suggestedArtistsPhotos: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing(2)
  },
  suggestedArtistPhoto: {
    height: 52,
    width: 52,
    marginRight: -7,
    borderWidth: 1
  },
  suggestedArtistsText: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: spacing(2)
  }
}))

type ArtistRecommendationsProps = {
  profile: User
  onClose: () => void
}

const getRelatedArtistIds = makeGetRelatedArtists()

export const ArtistRecommendations = (props: ArtistRecommendationsProps) => {
  const styles = useStyles()
  const { profile, onClose } = props
  const { user_id, name } = profile

  const dispatchWeb = useDispatchWeb()

  useEffectOnce(() => {
    dispatchWeb(fetchRelatedArtists({ userId: user_id }))

    track(
      make({
        eventName: EventNames.PROFILE_PAGE_SHOWN_ARTIST_RECOMMENDATIONS,
        userId: user_id
      })
    )
  })

  const suggestedArtists = useSelectorWeb(
    state => getRelatedArtistIds(state, { id: user_id }),
    (a, b) => a.length === b.length
  )

  const isFollowingAllArtists = suggestedArtists.every(
    artist => artist.does_current_user_follow
  )

  const handlePressFollow = useCallback(() => {
    suggestedArtists.forEach(artist => {
      if (isFollowingAllArtists) {
        dispatchWeb(
          unfollowUser(
            artist.user_id,
            FollowSource.ARTIST_RECOMMENDATIONS_POPUP
          )
        )
      } else {
        dispatchWeb(
          followUser(artist.user_id, FollowSource.ARTIST_RECOMMENDATIONS_POPUP)
        )
      }
    })
  }, [suggestedArtists, isFollowingAllArtists, dispatchWeb])

  const suggestedArtistNames = suggestedArtists.slice(0, 3)

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <IconButton
          icon={IconClose}
          styles={{ root: styles.dismissButton, icon: styles.dismissIcon }}
          fill={styles.dismissIcon.fill}
          onPress={onClose}
        />
        <Text variant='body1'>
          {messages.description} {name}
        </Text>
      </View>
      <View style={styles.suggestedArtistsPhotos}>
        {suggestedArtists.map(artist => (
          <ProfilePhoto
            key={artist.user_id}
            profile={artist}
            style={styles.suggestedArtistPhoto}
          />
        ))}
      </View>
      <View style={styles.suggestedArtistsText}>
        <Text variant='body1'>Featuring </Text>
        {suggestedArtistNames.map(artist => (
          <Fragment key={artist.user_id}>
            <ArtistLink artist={artist} />
            <Text variant='body1'>, </Text>
          </Fragment>
        ))}
        <Text variant='body1'>{`and ${
          suggestedArtists.length - suggestedArtistNames.length
        } others`}</Text>
      </View>
      <Button
        variant='primary'
        title={
          isFollowingAllArtists ? messages.followingAll : messages.followAll
        }
        icon={isFollowingAllArtists ? IconFollowing : IconFollow}
        iconPosition='left'
        fullWidth
        size='small'
        onPress={handlePressFollow}
      />
    </View>
  )
}
