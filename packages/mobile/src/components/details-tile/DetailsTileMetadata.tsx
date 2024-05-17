import type { PropsWithChildren } from 'react'

import type { ID } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { trpc } from '@audius/web/src/utils/trpcClientWeb'
import { Image } from 'react-native'

import { Flex, Text, TextLink, useTheme } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

const messages = {
  genre: 'Genre',
  mood: 'Mood',
  album: 'Album'
}

type MetadataProps = PropsWithChildren<{
  label: string
}>

const Metadata = (props: MetadataProps) => {
  const { label, children } = props

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
        {children}
      </Text>
    </Text>
  )
}

type DetailsTileMetadataProps = {
  id?: ID
  genre?: string
  mood?: Nullable<string>
}

export const DetailsTileMetadata = (props: DetailsTileMetadataProps) => {
  const { id, genre, mood } = props
  const { spacing } = useTheme()

  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    // @ts-ignore enabled flag handles the case where track is undefined
    { trackId: id },
    { enabled: !!id }
  )

  if (!genre && !mood && !albumInfo) return null

  return (
    <Flex w='100%' direction='row' gap='l' wrap='wrap'>
      {genre ? <Metadata label={messages.genre}>{genre}</Metadata> : null}
      {mood ? (
        <Flex direction='row' gap='xs'>
          <Metadata label={messages.mood}>{mood}</Metadata>
          <Image
            source={moodMap[mood]}
            style={{ height: spacing.l, width: spacing.l }}
          />
        </Flex>
      ) : null}
      {albumInfo ? (
        <Metadata label={messages.album}>
          <TextLink to={albumInfo.permalink}>
            {albumInfo.playlist_name}
          </TextLink>
        </Metadata>
      ) : null}
    </Flex>
  )
}
