import React from 'react'

import type { LineupData } from '@audius/common/api'
import { useRemixes, useTrack, useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import {
  Artwork,
  Box,
  Flex,
  IconArrowRight,
  PlainButton,
  Skeleton,
  Text
} from '@audius/harmony-native'
import { TrackLink } from 'app/components/track/TrackLink'
import { TrackFlair, Size } from 'app/components/track-flair'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'

const ARTWORK_SIZE = 120
const USER_AVATAR_SIZE = 40
const NAME_WIDTH = 120
const messages = {
  noSubmissions: 'No submissions yet',
  beFirst: 'Be the first to upload a remix!',
  viewAll: 'View All'
}

type RemixContestSubmissionsTabProps = {
  trackId: ID
}

/**
 * Tab content displaying submissions for a remix contest
 */
export const RemixContestSubmissionsTab = ({
  trackId
}: RemixContestSubmissionsTabProps) => {
  const { data: remixes } = useRemixes({ trackId, isContestEntry: true })
  const submissions = remixes?.slice(0, 6)

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
      <Flex h={ARTWORK_SIZE} w={ARTWORK_SIZE}>
        {displaySkeleton ? (
          <Skeleton />
        ) : (
          <>
            <TrackFlair
              style={{
                height: '100%',
                width: '100%',
                borderRadius: 4,
                overflow: 'hidden'
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
          </>
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

const RemixContestSubmissions = ({
  trackId,
  submissions
}: {
  trackId: ID
  submissions: LineupData[]
}) => {
  const navigation = useNavigation()

  return (
    <Flex w='100%' column gap='2xl' pt='xl' pb='2xl' ph='l' borderTop='default'>
      <Flex gap='2xl' wrap='wrap' justifyContent='space-around'>
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </Flex>
      <Flex justifyContent='center'>
        <PlainButton
          iconRight={IconArrowRight}
          onPress={() => {
            navigation.navigate('TrackRemixes', { trackId })
          }}
        >
          {messages.viewAll}
        </PlainButton>
      </Flex>
    </Flex>
  )
}

const EmptyRemixContestSubmissions = () => {
  return (
    <Flex
      column
      w='100%'
      pv='2xl'
      gap='s'
      justifyContent='center'
      alignItems='center'
    >
      <Text variant='title'>{messages.noSubmissions}</Text>
      <Text variant='body' color='subdued'>
        {messages.beFirst}
      </Text>
    </Flex>
  )
}
