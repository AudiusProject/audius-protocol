import { useTrackPageLineup } from '@audius/common/api'
import type { Track, User } from '@audius/common/models'
import { tracksActions } from '~/store/pages/track/lineup/actions'

import { Flex, Text } from '@audius/harmony-native'
import { Lineup } from 'app/components/lineup'

const DEFAULT_PAGE_SIZE = 6

type TrackScreenLineupProps = {
  user: User | null
  track: Track | null
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

const messages = {
  originalTrack: 'Original Track',
  remixes: 'Remixes of this Track',
  moreBy: (name: string) => `More by ${name}`,
  youMightAlsoLike: 'You Might Also Like'
}

export const TrackScreenLineup = ({ user, track }: TrackScreenLineupProps) => {
  const {
    indices,
    pageSize = DEFAULT_PAGE_SIZE,
    lineup
  } = useTrackPageLineup({
    trackId: track?.track_id,
    ownerHandle: user?.handle
  })

  if (!indices) return null

  const renderRemixParentSection = () => {
    if (indices.remixParentIndex === null) return null

    return (
      <Section title={messages.originalTrack}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={indices.remixParentIndex}
          pageSize={1}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  const renderRemixesSection = () => {
    if (indices.remixesStartIndex === null) return null
    const start = indices.remixesStartIndex
    const end = indices.moreByTracksStartIndex

    return (
      <Section title={messages.remixes}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={start}
          pageSize={end !== null ? end - start : pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  const renderMoreBySection = () => {
    if (indices.moreByTracksStartIndex === null) return null
    const start = indices.moreByTracksStartIndex
    const end = indices.recommendedTracksStartIndex

    return (
      <Section title={messages.moreBy(user?.name ?? '')}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={start}
          pageSize={end !== null ? end - start : pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  const renderRecommendedSection = () => {
    if (indices.recommendedTracksStartIndex === null) return null

    return (
      <Section title={messages.youMightAlsoLike}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={indices.recommendedTracksStartIndex}
          pageSize={pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  return (
    <Flex direction='column' gap='2xl'>
      {renderRemixParentSection()}
      {renderRemixesSection()}
      {renderMoreBySection()}
      {renderRecommendedSection()}
    </Flex>
  )
}
