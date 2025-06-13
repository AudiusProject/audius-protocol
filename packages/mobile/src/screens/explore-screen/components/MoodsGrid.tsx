import React, { useCallback, useMemo } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import type { Mood } from '@audius/sdk'
import { MOODS } from 'pages/search-page/moods'
import type { MoodInfo } from 'pages/search-page/types'
import { Image } from 'react-native'

import { Flex, Paper, Text, useTheme } from '@audius/harmony-native'
import {
  useSearchCategory,
  useSearchFilters
} from 'app/screens/search-screen/searchState'
import { moodMap } from 'app/utils/moods'

export const MoodsGrid = () => {
  const { spacing } = useTheme()

  const moodEntries = useMemo(
    () => Object.entries(MOODS) as [string, MoodInfo][],
    []
  )

  const [, setCategory] = useSearchCategory()
  const [, setFilters] = useSearchFilters()

  const handleMoodPress = useCallback(
    (moodLabel: Mood) => {
      setCategory('tracks')
      setFilters({ mood: moodLabel })
    },
    [setCategory, setFilters]
  )

  return (
    <Flex justifyContent='center' gap='l'>
      <Text variant='title' size='l' textAlign='center'>
        {messages.exploreByMood}
      </Text>
      <Flex wrap='wrap' direction='row' justifyContent='center' gap='s'>
        {moodEntries.sort().map(([_, moodInfo]) => (
          <Paper
            direction='row'
            key={moodInfo.label}
            pv='l'
            ph='xl'
            gap='m'
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
    </Flex>
  )
}
