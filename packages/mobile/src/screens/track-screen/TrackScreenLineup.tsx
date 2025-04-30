import { useCallback } from 'react'

import { useRemixContest, useTrackPageLineup } from '@audius/common/api'
import { trackPageMessages as messages } from '@audius/common/messages'
import type { ID, User } from '@audius/common/models'
import { useFocusEffect } from '@react-navigation/native'
import { tracksActions } from '~/store/pages/track/lineup/actions'

import { Flex, Text } from '@audius/harmony-native'
import { TanQueryLineup } from 'app/components/lineup/TanQueryLineup'

import { ViewOtherRemixesButton } from './ViewOtherRemixesButton'

type TrackScreenLineupProps = {
  user: User | null
  trackId: ID
}

type SectionProps = {
  title: string
  children: React.ReactNode
}

const Section = ({ title, children }: SectionProps) => {
  return (
    <Flex w='100%'>
      <Text variant='title' size='l'>
        {title}
      </Text>
      {children}
    </Flex>
  )
}

const itemStyles = {
  paddingHorizontal: 0
}

export const TrackScreenLineup = ({
  user,
  trackId
}: TrackScreenLineupProps) => {
  const {
    indices,
    lineup,
    pageSize,
    isFetching,
    loadNextPage,
    isPending,
    data,
    loadCachedDataIntoLineup
  } = useTrackPageLineup({ trackId, disableAutomaticCacheHandling: true })
  const { data: remixContest } = useRemixContest(trackId)
  const isRemixContest = !!remixContest

  useFocusEffect(
    useCallback(() => {
      if (data.length > 0) {
        loadCachedDataIntoLineup()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadCachedDataIntoLineup])
  )

  if (!indices) return null

  const renderRemixParentSection = () => {
    if (indices.remixParentSection.index === undefined) return null

    const parentTrackId = data?.[indices.remixParentSection.index]?.id

    return (
      <Section title={messages.originalTrack}>
        <Flex column gap='l'>
          <TanQueryLineup
            actions={tracksActions}
            lineup={lineup}
            offset={indices.remixParentSection.index}
            maxEntries={indices.remixParentSection.pageSize}
            pageSize={pageSize}
            includeLineupStatus
            itemStyles={itemStyles}
            isFetching={isFetching}
            loadNextPage={loadNextPage}
            hasMore={false}
            isPending={isPending}
            queryData={data}
            shouldShowPlayBarChin={false}
          />
          {parentTrackId ? (
            <ViewOtherRemixesButton parentTrackId={parentTrackId} />
          ) : null}
        </Flex>
      </Section>
    )
  }

  const renderRemixesSection = () => {
    if (indices.remixesSection.index === undefined) return null

    return (
      <Section title={messages.remixes}>
        <Flex column gap='l'>
          <TanQueryLineup
            actions={tracksActions}
            lineup={lineup}
            offset={indices.remixesSection.index}
            maxEntries={indices.remixesSection.pageSize}
            pageSize={pageSize}
            includeLineupStatus
            itemStyles={itemStyles}
            isFetching={isFetching}
            loadNextPage={loadNextPage}
            hasMore={false}
            isPending={isPending}
            queryData={data}
          />
          <ViewOtherRemixesButton parentTrackId={trackId} />
        </Flex>
      </Section>
    )
  }

  const renderMoreBySection = () => {
    if (indices.moreBySection.index === undefined) return null

    return (
      <Section title={messages.moreBy(user?.name ?? '')}>
        <TanQueryLineup
          actions={tracksActions}
          lineup={lineup}
          offset={indices.moreBySection.index}
          maxEntries={indices.moreBySection.pageSize ?? pageSize}
          pageSize={pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
          isFetching={isFetching}
          loadNextPage={loadNextPage}
          hasMore={false}
          isPending={isPending}
          queryData={data}
        />
      </Section>
    )
  }

  const renderRecommendedSection = () => {
    if (indices.recommendedSection.index === undefined) return null

    return (
      <Section title={messages.youMightAlsoLike}>
        <TanQueryLineup
          actions={tracksActions}
          lineup={lineup}
          offset={indices.recommendedSection.index}
          maxEntries={indices.recommendedSection.pageSize}
          pageSize={pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
          isFetching={isFetching}
          loadNextPage={loadNextPage}
          hasMore={false}
          isPending={isPending}
          queryData={data}
        />
      </Section>
    )
  }

  return (
    <Flex direction='column' gap='2xl'>
      {!isRemixContest ? renderRemixParentSection() : null}
      {!isRemixContest ? renderRemixesSection() : null}
      {renderMoreBySection()}
      {renderRecommendedSection()}
    </Flex>
  )
}
