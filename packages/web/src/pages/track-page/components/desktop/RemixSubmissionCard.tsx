import { useCallback } from 'react'

import { useUser, useTrack } from '@audius/common/api'
import { ID, SquareSizes } from '@audius/common/models'
import { Box, Flex, Skeleton } from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { UserLink, TrackLink } from 'components/link'
import { TrackArtwork } from 'components/track/TrackArtwork'
import TrackFlair, { Size } from 'components/track-flair/TrackFlair'

const ARTWORK_SIZE = 160
const USER_AVATAR_SIZE = 64
const NAME_WIDTH = 140

type RemixSubmissionCardProps = {
  trackId: ID
}

export const RemixSubmissionCard = ({ trackId }: RemixSubmissionCardProps) => {
  const navigate = useNavigate()
  const { data: track, isLoading: trackLoading } = useTrack(trackId)
  const { data: user, isLoading: userLoading } = useUser(track?.owner_id)
  const isLoading = trackLoading || userLoading
  const displaySkeleton = isLoading || !track || !user

  const goToTrack = useCallback(() => {
    if (!track?.permalink) return
    navigate(track.permalink)
  }, [navigate, track?.permalink])

  return (
    <Flex column gap='s'>
      <Flex h={ARTWORK_SIZE} w={ARTWORK_SIZE} borderRadius='s'>
        {displaySkeleton ? (
          <Skeleton h={ARTWORK_SIZE} w={ARTWORK_SIZE} borderRadius='s' />
        ) : (
          <>
            {/* Track Artwork with Flair */}
            <TrackFlair
              css={{ height: '100%', width: '100%' }}
              id={track.track_id}
              size={Size.LARGE}
              hideToolTip
            >
              <TrackArtwork
                css={{
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer'
                }}
                trackId={track.track_id}
                onClick={goToTrack}
                size={SquareSizes.SIZE_480_BY_480}
              />
            </TrackFlair>
            {/* User Avatar */}
            <Box
              h={USER_AVATAR_SIZE}
              w={USER_AVATAR_SIZE}
              css={{ position: 'absolute', top: -8, right: -8, zIndex: 10 }}
              borderRadius='circle'
            >
              <Avatar
                userId={user.user_id}
                imageSize={SquareSizes.SIZE_150_BY_150}
              />
            </Box>
          </>
        )}
      </Flex>
      <Flex column gap='xs' w={ARTWORK_SIZE}>
        {displaySkeleton ? (
          <>
            <Skeleton h={24} w={120} />
            <Skeleton h={24} w={80} />
          </>
        ) : (
          <>
            <TrackLink
              textVariant='title'
              trackId={track.track_id}
              ellipses
              css={{ display: 'block', maxWidth: NAME_WIDTH }}
            />
            <UserLink
              userId={user.user_id}
              popover
              ellipses
              css={{ display: 'block', maxWidth: NAME_WIDTH }}
            />
          </>
        )}
      </Flex>
    </Flex>
  )
}
