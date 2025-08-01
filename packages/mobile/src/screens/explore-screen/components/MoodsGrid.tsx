import React, { useMemo, useCallback } from 'react'

import { labelByCategory } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import type { Mood } from '@audius/sdk'
import { MOODS } from 'pages/search-page/moods'
import type { MoodInfo } from 'pages/search-page/types'
import { Image } from 'react-native'

import { Flex, Paper, Text, useTheme } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

import {
  useSearchCategory,
  useSearchFilters
} from '../../search-screen/searchState.tsx'

import { ExploreSection } from './ExploreSection.tsx'

interface MoodsGridProps {
  isLoading?: boolean
}

export const MoodsGrid = ({ isLoading: externalLoading }: MoodsGridProps) => {
  const { spacing } = useTheme()
  const [category, setCategory] = useSearchCategory()
  const [, setFilters] = useSearchFilters()

  const moodEntries = useMemo(
    () => Object.entries(MOODS) as [string, MoodInfo][],
    []
  )

  const handleMoodPress = useCallback(
    (moodLabel: Mood) => {
      if (category === 'all') {
        setCategory('tracks')
      }
      setFilters({ mood: moodLabel })
    },
    [setFilters, setCategory, category]
  )

  if (externalLoading) {
    return null
  }
  return (
    <ExploreSection
      title={messages.exploreByMood(labelByCategory[category])}
      centered
      isLoading={externalLoading}
    >
      <Flex wrap='wrap' direction='row' justifyContent='center' gap='s'>
        {moodEntries.sort().map(([_, moodInfo]) => (
          <Paper
            direction='row'
            key={moodInfo.label}
            pv='l'
            ph='xl'
            gap='s'
            borderRadius='m'
            border='default'
            backgroundColor='white'
            onPress={() => {
              handleMoodPress(moodInfo.label)
            }}
          >
            <Image
              source={moodMap[moodInfo.label]}
              style={{
                height: spacing.unit5,
                width: spacing.unit5
              }}
            />
            <Text variant='title' size='s'>
              {moodInfo.label}
            </Text>
          </Paper>
        ))}
      </Flex>
    </ExploreSection>
  )
}
