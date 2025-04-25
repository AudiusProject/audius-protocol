import { LineupData, useUser, useTrack } from '@audius/common/api'
import { ID, SquareSizes } from '@audius/common/models'
import {
  Box,
  Flex,
  IconArrowRight,
  PlainButton,
  Skeleton,
  Text
} from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { TrackLink, UserLink } from 'components/link'
import { TrackArtwork } from 'components/track/TrackArtwork'
import TrackFlair, { Size } from 'components/track-flair/TrackFlair'
import { trackRemixesPage } from 'utils/route'

const artworkSize = 160
const userAvatarSize = 64

const messages = {
  noSubmissions: 'No submissions yet',
  beFirst: 'Be the first to upload a remix!',
  viewAll: 'View All'
}

type RemixContestSubmissionsTabProps = {
  trackId: ID
  submissions: LineupData[]
}

/**
 * Tab content displaying submissions for a remix contest
 */
export const RemixContestSubmissionsTab = ({
  trackId,
  submissions
}: RemixContestSubmissionsTabProps) => {
  // If there are no submissions, show the empty state
  if (submissions.length === 0) {
    return <EmptyRemixContestSubmissions />
  }

  return <RemixContestSubmissions trackId={trackId} submissions={submissions} />
}

const SubmissionCard = ({ submission }: { submission: LineupData }) => {
  const { data: track, isLoading: trackLoading } = useTrack(submission.id)
  const { data: user, isLoading: userLoading } = useUser(track?.owner_id)
  const isLoading = trackLoading || userLoading
  const displaySkeleton = isLoading || !track || !user

  return (
    <Flex column gap='s'>
      <Flex h={artworkSize} w={artworkSize} borderRadius='s'>
        {displaySkeleton ? (
          <Skeleton h={artworkSize} w={artworkSize} borderRadius='s' />
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
                style={{
                  width: '100%',
                  height: '100%'
                }}
                trackId={track.track_id}
                size={SquareSizes.SIZE_480_BY_480}
              />
            </TrackFlair>
            {/* User Avatar */}
            <Box
              h={userAvatarSize}
              w={userAvatarSize}
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
      <Flex column gap='xs'>
        {displaySkeleton ? (
          <>
            <Skeleton h={24} w={120} />
            <Skeleton h={24} w={80} />
          </>
        ) : (
          <>
            <TrackLink textVariant='title' trackId={track.track_id} />
            <UserLink userId={user.user_id} popover />
          </>
        )}
      </Flex>
    </Flex>
  )
}

const RemixContestSubmissions = ({
  trackId,
  submissions
}: {
  trackId: ID
  submissions: LineupData[]
}) => {
  const { data: permalink } = useTrack(trackId, {
    select: (track) => track.permalink
  })

  const remixesRoute = trackRemixesPage(permalink ?? '')

  return (
    <Flex column p='xl'>
      <Flex gap='2xl' wrap='wrap'>
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </Flex>
      <Flex justifyContent='center'>
        <PlainButton size='large' iconRight={IconArrowRight} asChild>
          <Link to={remixesRoute}>{messages.viewAll}</Link>
        </PlainButton>
      </Flex>
    </Flex>
  )
}

const EmptyRemixContestSubmissions = () => {
  return (
    <Flex column pv='3xl' gap='xs' alignItems='center'>
      <Text variant='title'>{messages.noSubmissions}</Text>
      <Text variant='body' color='subdued'>
        {messages.beFirst}
      </Text>
    </Flex>
  )
}
