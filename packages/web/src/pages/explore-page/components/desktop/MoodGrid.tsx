import { useCallback } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import { Flex, Paper, Text, useTheme } from '@audius/harmony'
import { Mood } from '@audius/sdk'

import { useSearchCategory } from 'pages/search-page/hooks'
import { MOODS } from 'pages/search-page/moods'
import { labelByCategoryView } from 'pages/search-page/types'

export const MoodGrid = () => {
  const [category, setCategory] = useSearchCategory()
  const { color } = useTheme()

  const handleMoodPress = useCallback(
    (mood: Mood) => {
      setCategory(category, { mood })
    },
    [category, setCategory]
  )

  return (
    <Flex direction='column' gap='l' alignItems='center'>
      <Text variant='heading'>
        {messages.exploreByMood(
          category === 'all' ? undefined : labelByCategoryView[category]
        )}
      </Text>
      <Flex gap='s' justifyContent='center' alignItems='flex-start' wrap='wrap'>
        {Object.entries(MOODS)
          .sort()
          .map(([mood, moodInfo]) => (
            <Paper
              key={mood}
              pv='l'
              ph='xl'
              gap='s'
              borderRadius='m'
              border='default'
              backgroundColor='white'
              onClick={() => handleMoodPress(moodInfo.value)}
              css={{
                ':hover': {
                  background: color.neutral.n25,
                  border: `1px solid ${color.neutral.n150}`
                }
              }}
            >
              {moodInfo.icon}
              <Text variant='title' size='s'>
                {moodInfo.label}
              </Text>
            </Paper>
          ))}
      </Flex>
    </Flex>
  )
}
