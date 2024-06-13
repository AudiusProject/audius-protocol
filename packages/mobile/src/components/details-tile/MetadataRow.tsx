import type { PropsWithChildren } from 'react'

import type { Mood } from '@audius/sdk'
import { Image } from 'react-native'

import { Flex, Text, spacing } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

type MetadataRowProps = PropsWithChildren<{
  label: string
}>

export const MetadataRow = ({ label, children }: MetadataRowProps) => {
  return (
    <Flex direction='row' alignItems='center' key={label} gap='xs'>
      <Text variant='label'>{label}</Text>
      {label === 'Mood' ? (
        <Flex direction='row' gap='xs' alignItems='center'>
          <Text variant='body' size='s' strength='strong'>
            {children}
          </Text>
          <Image
            source={moodMap[children as Mood]}
            style={{ height: spacing.l, width: spacing.l }}
          />
        </Flex>
      ) : (
        <Text variant='body' size='s' strength='strong'>
          {children}
        </Text>
      )}
    </Flex>
  )
}
