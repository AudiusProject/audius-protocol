import { formatDate, formatSecondsAsText } from '@audius/common/utils'
import { Box, Flex, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

type AlbumDetailsTextProps = {
  lastModifiedDate?: number | string
  releaseDate: number | string
  numTracks: number
  duration: number | null
}
export const AlbumDetailsText = ({
  duration,
  lastModifiedDate,
  numTracks,
  releaseDate
}: AlbumDetailsTextProps) => {
  const isMobile = useIsMobile()
  const renderAlbumDetailsText = () => {
    const releaseAndUpdatedText = lastModifiedDate
      ? `Released ${formatDate(`${releaseDate}`)}, Updated ${formatDate(
          `${lastModifiedDate}`
        )}`
      : `Released ${formatDate(`${releaseDate}`)}`

    const trackCountText = `${numTracks} tracks`
    const durationText = duration ? `, ${formatSecondsAsText(duration)}` : ''
    return isMobile ? (
      <Flex direction='column' gap='xs'>
        <Box>{releaseAndUpdatedText}</Box>
        <Box>
          {trackCountText}
          {durationText}
        </Box>
      </Flex>
    ) : (
      <>{`${releaseAndUpdatedText} • ${trackCountText}${durationText}`}</>
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
