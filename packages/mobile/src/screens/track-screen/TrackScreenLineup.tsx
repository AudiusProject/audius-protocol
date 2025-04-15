import { useTrackPageLineup } from '@audius/common/api'
import type { ID, User } from '@audius/common/models'
import { tracksActions } from '~/store/pages/track/lineup/actions'

import { Flex, Text } from '@audius/harmony-native'
import { Lineup } from 'app/components/lineup'

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

const messages = {
  originalTrack: 'Original Track',
  remixes: 'Remixes of this Track',
  moreBy: (name: string) => `More by ${name}`,
  youMightAlsoLike: 'You Might Also Like'
}

export const TrackScreenLineup = ({
  user,
  trackId
}: TrackScreenLineupProps) => {
  const { indices, lineup, pageSize } = useTrackPageLineup({ trackId })

  if (!indices) return null

  const renderRemixParentSection = () => {
    if (indices.remixParentSection.index === undefined) return null

    return (
      <Section title={messages.originalTrack}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={indices.remixParentSection.index}
          pageSize={indices.remixParentSection.pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  const renderRemixesSection = () => {
    if (indices.remixesSection.index === null) return null

    return (
      <Section title={messages.remixes}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={indices.remixesSection.index}
          pageSize={indices.remixesSection.pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  const renderMoreBySection = () => {
    if (indices.moreBySection.index === undefined) return null

    return (
      <Section title={messages.moreBy(user?.name ?? '')}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={indices.moreBySection.index}
          pageSize={indices.moreBySection.pageSize ?? pageSize}
          includeLineupStatus
          itemStyles={itemStyles}
        />
      </Section>
    )
  }

  const renderRecommendedSection = () => {
    if (indices.recommendedSection.index === undefined) return null

    return (
      <Section title={messages.youMightAlsoLike}>
        <Lineup
          tanQuery
          actions={tracksActions}
          lineup={lineup}
          start={indices.recommendedSection.index}
          pageSize={indices.recommendedSection.pageSize}
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
