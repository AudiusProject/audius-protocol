import React from 'react'

import { useRemixes } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { Flex, IconArrowRight, PlainButton, Text } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { RemixSubmissionCard } from './RemixSubmissionCard'

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
  const navigation = useNavigation()
  const { data: remixes } = useRemixes({ trackId, isContestEntry: true })
  const submissions = remixes?.slice(0, 6)

  // If there are no submissions, show the empty state
  if (submissions.length === 0) {
    return <EmptyRemixContestSubmissions />
  }

  return (
    <Flex w='100%' column gap='2xl' p='xl' pb='2xl' borderTop='default'>
      <Flex row gap='2xl' wrap='wrap' justifyContent='space-between'>
        {submissions.map((submission) => (
          <RemixSubmissionCard key={submission.id} trackId={submission.id} />
        ))}
      </Flex>
      <Flex justifyContent='center'>
        <PlainButton
          iconRight={IconArrowRight}
          onPress={() => {
            navigation.push('TrackRemixes', { trackId })
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
