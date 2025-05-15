import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, IconArrowRight, PlainButton, Text } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { trackRemixesPage } from 'utils/route'

import { RemixSubmissionCard } from './RemixSubmissionCard'

const messages = {
  noWinners: 'No winners announced yet',
  stayTuned: 'Stay tuned for the results!',
  viewAll: 'View All'
}

type RemixContestWinnersTabProps = {
  trackId: ID
  winnerIds: ID[]
}

/**
 * Tab content displaying winners for a remix contest
 */
export const RemixContestWinnersTab = ({
  trackId,
  winnerIds
}: RemixContestWinnersTabProps) => {
  const { data: permalink } = useTrack(trackId, {
    select: (track) => track.permalink
  })

  // If there are no winners, show the empty state
  // NOTE: This should never happen, but just in case
  if (winnerIds.length === 0) {
    return <EmptyRemixContestWinners />
  }

  const pathname = trackRemixesPage(permalink ?? '')
  const search = new URLSearchParams({ isContestEntry: 'true' }).toString()

  return (
    <Flex column p='xl' gap='xl'>
      <Flex row gap='2xl' wrap='wrap'>
        {winnerIds.map((winnerTrackId) => (
          <RemixSubmissionCard key={winnerTrackId} trackId={winnerTrackId} />
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

const EmptyRemixContestWinners = () => {
  return (
    <Flex column pv='3xl' gap='xs' alignItems='center'>
      <Text variant='title'>{messages.noWinners}</Text>
      <Text variant='body' color='subdued'>
        {messages.stayTuned}
      </Text>
    </Flex>
  )
}
