import React, { useCallback, useMemo } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import {
  QUICK_SEARCH_PRESETS,
  type QuickSearchPreset
} from '@audius/common/utils'
import { getCanonicalName } from '@audius/common/utils'
import { Image } from 'react-native'

import { Box, Flex, Paper, Text, useTheme } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

import {
  useSearchCategory,
  useSearchFilters
} from '../../search-screen/searchState.tsx'

import { ExploreSection } from './ExploreSection.tsx'

const QuickSearchPresetButton = ({
  preset,
  onPress
}: {
  preset: QuickSearchPreset
  onPress: () => void
}) => {
  const { spacing } = useTheme()

  const parts = useMemo(() => {
    const parts: React.ReactNode[] = []
    if (preset.genre) {
      parts.push(
        <Text variant='title' size='s'>
          {getCanonicalName(preset.genre)}
        </Text>
      )
    }
    if (preset.mood) {
      parts.push(
        <>
          <Image
            source={moodMap[preset.mood]}
            style={{
              height: spacing.unit5,
              width: spacing.unit5
            }}
          />
          <Box w={spacing.unit1} />
          <Text variant='title' size='s'>
            {preset.mood}
          </Text>
        </>
      )
    }
    if (preset.key) {
      parts.push(
        <Text variant='title' size='s'>
          {preset.key}
        </Text>
      )
    }
    if (preset.isVerified) {
      parts.push(
        <Text variant='title' size='s'>
          {messages.verified}
        </Text>
      )
    }
    if (preset.bpm) {
      parts.push(
        <Text variant='title' size='s'>
          {preset.bpm.description}
        </Text>
      )
    }
    return parts
  }, [preset, spacing])

  return (
    <Paper
      direction='row'
      pv='l'
      ph='xl'
      borderRadius='m'
      border='default'
      backgroundColor='white'
      onPress={onPress}
    >
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {part}
          {idx < parts.length - 1 ? (
            <Text variant='title' size='s'>
              {' + '}
            </Text>
          ) : null}
        </React.Fragment>
      ))}
    </Paper>
  )
}

export const QuickSearchGrid = () => {
  const [, setCategory] = useSearchCategory()
  const [, setFilters] = useSearchFilters()

  const handlePressPreset = useCallback(
    (preset: QuickSearchPreset) => {
      // TODO: Support tabs
      setCategory('tracks')
      setFilters({
        mood: preset.mood,
        genre: preset.genre,
        bpm: preset.bpm?.value,
        isVerified: preset.isVerified ? true : undefined,
        key: preset.key
      })
    },
    [setCategory, setFilters]
  )

  return (
    <ExploreSection title={messages.quickSearch} centered>
      <Flex wrap='wrap' direction='row' justifyContent='center' gap='s'>
        {QUICK_SEARCH_PRESETS.map((preset, idx) => (
          <QuickSearchPresetButton
            key={idx}
            preset={preset}
            onPress={() => {
              handlePressPreset(preset)
            }}
          />
        ))}
      </Flex>
    </ExploreSection>
  )
}
