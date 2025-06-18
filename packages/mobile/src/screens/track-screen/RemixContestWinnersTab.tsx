import React from 'react'

import { useRemixContest, useRemixesLineup } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { Flex, IconArrowRight, PlainButton, Text } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { RemixSubmissionCard } from './RemixSubmissionCard'

const messages = {
  noWinners: 'No winners announced yet',
  stayTuned: 'Stay tuned for the results!',
  viewAll: 'View All'
}

type RemixContestWinnersTabProps = {
  trackId: ID
}

/**
 * Tab content displaying winners for a remix contest
 */
export const RemixContestWinnersTab = ({
  trackId
}: RemixContestWinnersTabProps) => {
  const navigation = useNavigation()
  const { data: remixContest } = useRemixContest(trackId)
  const { count: submissionCount } = useRemixesLineup({
    trackId,
    isContestEntry: true
  })
  const winners = remixContest?.eventData?.winners ?? []

  // If there are no winners, show the empty state
  // NOTE: This should never happen, but just in case
  if (winners.length === 0) {
    return <EmptyRemixContestWinners />
  }

  return (
    <Flex w='100%' column gap='2xl' p='xl' pb='2xl' borderTop='default'>
      <Flex row gap='2xl' wrap='wrap' justifyContent='space-between'>
        {winners.map((winnerId) => (
          <RemixSubmissionCard key={winnerId} trackId={winnerId} />
        ))}
      </Flex>
      <Flex justifyContent='center'>
        <PlainButton
          iconRight={IconArrowRight}
          onPress={() => {
            navigation.push('TrackRemixes', { trackId })
          }}
        >
          {`${messages.viewAll}${submissionCount ? ` (${submissionCount})` : ''}`}
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
      pv='2xl'
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
