import { Fragment, useCallback, useState } from 'react'

import {
  useRelatedArtists,
  useFollowUser,
  useUnfollowUser
} from '@audius/common/api'
import { FollowSource } from '@audius/common/models'
import type { User } from '@audius/common/models'
import { css } from '@emotion/native'
import { isEmpty } from 'lodash'
import { TouchableOpacity } from 'react-native'

import {
  IconClose,
  useTheme,
  IconButton,
  Flex,
  Text,
  FollowButton
} from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'

import { useSelectProfile } from '../selectors'

const messages = {
  description: 'Here are some accounts that vibe well with',
  follow: 'Follow All',
  unfollow: 'Unfollow All',
  following: 'Following All',
  closeLabel: 'Close'
}

type ArtistRecommendationsProps = {
  onClose: () => void
}

export const ArtistRecommendations = (props: ArtistRecommendationsProps) => {
  const { onClose } = props
  const { spacing } = useTheme()
  const navigation = useNavigation()
  const { user_id, name } = useSelectProfile(['user_id', 'name'])
  const [hasFollowedAll, setHasFollowedAll] = useState(false)
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  const { data: suggestedArtists = [], isPending } = useRelatedArtists({
    artistId: user_id,
    filterFollowed: true,
    pageSize: 7
  })

  const handlePressFollow = useCallback(() => {
    suggestedArtists.forEach((artist) => {
      followUser({
        followeeUserId: artist.user_id,
        source: FollowSource.ARTIST_RECOMMENDATIONS_POPUP
      })
    })
    setHasFollowedAll(true)
  }, [suggestedArtists, followUser])

  const handlePressUnfollow = useCallback(() => {
    suggestedArtists.forEach((artist) => {
      unfollowUser({
        followeeUserId: artist.user_id,
        source: FollowSource.ARTIST_RECOMMENDATIONS_POPUP
      })
    })
    setHasFollowedAll(false)
  }, [suggestedArtists, unfollowUser])

  const handlePressArtist = useCallback(
    (artist: User) => () => {
      navigation.push('Profile', { handle: artist.handle })
    },
    [navigation]
  )

  const suggestedArtistNames = suggestedArtists.slice(0, 3)

  if (isEmpty(suggestedArtists)) {
    return null
  }

  return (
    <Flex gap='s' pb='m'>
      <Flex row alignItems='center' gap='s'>
        <IconButton
          icon={IconClose}
          color='subdued'
          aria-label={messages.closeLabel}
          size='s'
          onPress={onClose}
        />
        <Text textAlign='center' size='s'>
          {messages.description} {name}
        </Text>
      </Flex>
      <Flex row justifyContent='center'>
        {suggestedArtists.map((artist) => (
          <TouchableOpacity
            onPress={handlePressArtist(artist)}
            key={artist.user_id}
          >
            <ProfilePicture
              userId={artist.user_id}
              style={css({
                height: spacing.unit13,
                width: spacing.unit13,
                marginRight: -spacing.m
              })}
              borderWidth='thin'
            />
          </TouchableOpacity>
        ))}
      </Flex>
      <Text>
        Featuring{' '}
        {suggestedArtistNames.map((artist) => (
          <Fragment key={artist.user_id}>
            <UserLink variant='visible' userId={artist.user_id} />
            <Text>, </Text>
          </Fragment>
        ))}
        <Text>{`and ${
          suggestedArtists.length - suggestedArtistNames.length
        } others`}</Text>
      </Text>
      <FollowButton
        isFollowing={hasFollowedAll}
        onFollow={handlePressFollow}
        onUnfollow={handlePressUnfollow}
        disabled={isPending}
        messages={messages}
      />
    </Flex>
  )
}
