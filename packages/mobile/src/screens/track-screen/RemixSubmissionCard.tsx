import React, { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { Artwork, Box, Flex, Paper, Skeleton } from '@audius/harmony-native'
import { TrackLink } from 'app/components/track/TrackLink'
import { TrackFlair, Size } from 'app/components/track-flair'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'

const ARTWORK_SIZE = 120
const USER_AVATAR_SIZE = 40
const NAME_WIDTH = 120

type RemixSubmissionCardProps = {
  trackId: ID
}

export const RemixSubmissionCard = ({ trackId }: RemixSubmissionCardProps) => {
  const navigation = useNavigation()
  const { data: track, isLoading: trackLoading } = useTrack(trackId)
  const { data: user, isLoading: userLoading } = useUser(track?.owner_id)
  const isLoading = trackLoading || userLoading
  const displaySkeleton = isLoading || !track || !user

  const handlePress = useCallback(() => {
    navigation.push('Track', { trackId })
  }, [navigation, trackId])

  return (
    <Flex column gap='s'>
      <Flex h={ARTWORK_SIZE} w={ARTWORK_SIZE}>
        {displaySkeleton ? (
          <Skeleton />
        ) : (
          <Paper onPress={handlePress}>
            <TrackFlair
              style={{
                height: '100%',
                width: '100%',
                borderRadius: 4
              }}
              trackId={track.track_id}
              size={Size.SMALL}
            >
              <Artwork source={{ uri: track.artwork['150x150'] }} />
            </TrackFlair>
            <Box
              h={USER_AVATAR_SIZE}
              w={USER_AVATAR_SIZE}
              borderRadius='circle'
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                overflow: 'hidden'
              }}
            >
              <Artwork source={{ uri: user.profile_picture['150x150'] }} />
            </Box>
          </Paper>
        )}
      </Flex>
      <Flex column gap='xs' alignItems='center'>
        {displaySkeleton ? (
          <>
            <Box h={20} w={100}>
              <Skeleton />
            </Box>
            <Box h={20} w={64}>
              <Skeleton />
            </Box>
          </>
        ) : (
          <>
            <TrackLink
              textVariant='title'
              size='s'
              trackId={track.track_id}
              ellipses
              numberOfLines={1}
              style={{ maxWidth: NAME_WIDTH }}
            />
            <UserLink
              userId={user.user_id}
              size='s'
              ellipses
              numberOfLines={1}
              style={{ maxWidth: NAME_WIDTH }}
            />
          </>
        )}
      </Flex>
    </Flex>
  )
}
