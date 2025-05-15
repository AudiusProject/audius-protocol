import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, IconArrowRight, PlainButton, Text } from '@audius/harmony'
import { Link } from 'react-router-dom'

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

  const remixesRoute = trackRemixesPage(permalink ?? '')

  return (
    <Flex w='100%' column gap='2xl' p='xl' pb='m'>
      <Flex gap='2xl' wrap='wrap' justifyContent='space-between'>
        {winnerIds.map((winnerTrackId) => (
          <RemixSubmissionCard key={winnerTrackId} trackId={winnerTrackId} />
        ))}
      </Flex>
      <Flex justifyContent='center'>
        <PlainButton iconRight={IconArrowRight} asChild>
          <Link to={remixesRoute}>{messages.viewAll}</Link>
        </PlainButton>
      </Flex>
    </Flex>
  )
}

const EmptyRemixContestWinners = () => {
  return (
    <Flex
      column
      w='100%'
      pv='xl'
      gap='s'
      justifyContent='center'
      alignItems='center'
    >
      <Text variant='title'>{messages.noWinners}</Text>
      <Text variant='body' color='subdued'>
        {messages.stayTuned}
      </Text>
    </Flex>
  )
}
