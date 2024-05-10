import type { Nullable } from '@audius/common/utils'
import { Image } from 'react-native'

import { Flex, Text, useTheme } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

const messages = {
  genre: 'Genre',
  mood: 'Mood'
}

type MetadataProps = {
  label: string
  value: string
}

const Metadata = (props: MetadataProps) => {
  const { label, value } = props

  return (
    <Text>
      <Text
        variant='label'
        color='subdued'
        // Adjusting line-height to match body
        style={{ lineHeight: 20 }}
      >
        {label}
      </Text>{' '}
      <Text variant='body' size='s' strength='strong'>
        {value}
      </Text>
    </Text>
  )
}

type DetailsTileMetadataProps = {
  genre?: string
  mood?: Nullable<string>
}

export const DetailsTileMetadata = (props: DetailsTileMetadataProps) => {
  const { genre, mood } = props
  const { spacing } = useTheme()

  if (!genre && !mood) return null

  return (
    <Flex w='100%' direction='row' gap='l'>
      {genre ? <Metadata label={messages.genre} value={genre} /> : null}
      {mood ? (
        <Flex direction='row' gap='xs'>
          <Metadata label={messages.mood} value={mood} />
          <Image
            source={moodMap[mood]}
            style={{ height: spacing.l, width: spacing.l }}
          />
        </Flex>
      ) : null}
    </Flex>
  )
}
