import { exploreMessages as messages } from '@audius/common/messages'
import { Flex, Paper, Text, useTheme } from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import { useSearchCategory } from 'pages/search-page/hooks'
import { MOODS } from 'pages/search-page/moods'
import { labelByCategoryView } from 'pages/search-page/types'

export const MoodGrid = () => {
  const navigate = useNavigate()
  const [category] = useSearchCategory()
  const { color } = useTheme()

  return (
    <Flex direction='column' gap='l' alignItems='center'>
      <Text variant='heading'>
        {messages.exploreByMood(labelByCategoryView[category])}
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
              onClick={() => {
                navigate(`/search/tracks?mood=${mood}`)
              }}
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
