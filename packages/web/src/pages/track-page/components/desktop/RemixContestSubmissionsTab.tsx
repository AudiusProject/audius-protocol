import { LineupData, useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, IconArrowRight, PlainButton, Text } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { trackRemixesPage } from 'utils/route'

import { RemixSubmissionCard } from './RemixSubmissionCard'

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
  const { data: permalink } = useTrack(trackId, {
    select: (track) => track.permalink
  })

  // If there are no submissions, show the empty state
  if (submissions.length === 0) {
    return <EmptyRemixContestSubmissions />
  }

  const pathname = trackRemixesPage(permalink ?? '')
  const search = new URLSearchParams({ isContestEntry: 'true' }).toString()

  return (
    <Flex column p='xl' gap='xl'>
      <Flex row gap='2xl' wrap='wrap'>
        {submissions.map((submission) => (
          <RemixSubmissionCard key={submission.id} trackId={submission.id} />
        ))}
      </Flex>
      <Flex justifyContent='center'>
        <PlainButton size='large' iconRight={IconArrowRight} asChild>
          <Link to={{ pathname, search }}>{messages.viewAll}</Link>
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
