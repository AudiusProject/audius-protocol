import {
  formatDate,
  formatSecondsAsText
} from '@audius/common/src/utils/timeUtil'
import { Box, Flex } from '@audius/harmony/src/components/layout/'
import { Text } from '@audius/harmony/src/components/text/Text'

import { useIsMobile } from 'hooks/useIsMobile'

type AlbumDetailsTextProps = {
  lastModifiedDate?: number | string
  releaseDate: number | string
  numTracks: number
  duration: number | null
}

export const AlbumDetailsText = (props: AlbumDetailsTextProps) => {
  const { duration, lastModifiedDate, numTracks, releaseDate } = props
  const isMobile = useIsMobile()
  const renderAlbumDetailsText = () => {
    const hasDate = lastModifiedDate || releaseDate
    const releaseAndUpdatedText = lastModifiedDate
      ? `Released ${formatDate(`${releaseDate}`)}, Updated ${formatDate(
          `${lastModifiedDate}`
        )}`
      : `Released ${formatDate(`${releaseDate}`)}`

    const trackCountText = `${numTracks} tracks`
    const durationText = duration ? `, ${formatSecondsAsText(duration)}` : ''

    return isMobile ? (
      <Flex direction='column' gap='xs'>
        {hasDate ? <Box>{releaseAndUpdatedText}</Box> : null}
        <Box>
          {trackCountText}
          {durationText}
        </Box>
      </Flex>
    ) : hasDate ? (
      `${releaseAndUpdatedText} • ${trackCountText}${durationText}`
    ) : (
      `${trackCountText}${durationText}`
    )
  }
  return (
    <Text
      variant='body'
      size='s'
      strength='strong'
      textAlign='left'
      color='default'
    >
      {renderAlbumDetailsText()}
    </Text>
  )
}
