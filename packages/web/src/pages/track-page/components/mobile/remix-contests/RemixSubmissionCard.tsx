import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import { ID, SquareSizes } from '@audius/common/models'
import { Box, Flex, Skeleton } from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { TrackLink, UserLink } from 'components/link'
import { TrackArtwork } from 'components/track/TrackArtwork'
import TrackFlair from 'components/track-flair/TrackFlair'
import { Size } from 'components/track-flair/types'

const ARTWORK_SIZE = 140
const USER_AVATAR_SIZE = 50
const NAME_WIDTH = 120

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
                  height: '100%'
                }}
                trackId={track.track_id}
                size={SquareSizes.SIZE_480_BY_480}
                onClick={goToTrack}
              />
            </TrackFlair>
            {/* User Avatar */}
            <Box
              h={USER_AVATAR_SIZE}
              w={USER_AVATAR_SIZE}
              css={{ position: 'absolute', top: -8, right: -8 }}
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
      <Flex column gap='xs' alignItems='center' w={ARTWORK_SIZE}>
        {displaySkeleton ? (
          <>
            <Skeleton h={20} w={100} />
            <Skeleton h={18} w={64} />
          </>
        ) : (
          <>
            <TrackLink
              textVariant='title'
              size='s'
              trackId={track.track_id}
              css={{ display: 'block', maxWidth: NAME_WIDTH }}
              ellipses
            />
            <UserLink
              userId={user.user_id}
              size='s'
              noOverflow
              ellipses
              css={{ display: 'block', maxWidth: NAME_WIDTH }}
            />
          </>
        )}
      </Flex>
    </Flex>
  )
}
