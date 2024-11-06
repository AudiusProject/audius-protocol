import { useCallback } from 'react'

import { useField } from 'formik'

import { Box, Divider, Flex, Text } from '@audius/harmony-native'
import { Switch } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { FormScreen } from 'app/screens/form-screen'

const messages = {
  title: 'Cover Attribution',
  cover: 'This Song is a Cover',
  description: 'This track was written by another artist.',
  attribution: {
    header: 'Please provide the original song title and artist name.',
    originalSongTitle: 'Original Song Title',
    originalArtist: 'Original Artist'
  }
}

export const COVER_ORIGINAL_SONG_TITLE = 'cover_original_song_title'
export const COVER_ORIGINAL_ARTIST = 'cover_original_artist'
export const IS_COVER = 'isCover'

export const CoverAttributionScreen = () => {
  const [{ value: isCover }, _ignored, { setValue: setIsCover }] =
    useField<boolean>(IS_COVER)
  const [{ value: originalSongTitle }, , { setValue: setOriginalSongTitle }] =
    useField<string | null>(COVER_ORIGINAL_SONG_TITLE)
  const [{ value: originalArtist }, , { setValue: setOriginalArtist }] =
    useField<string | null>(COVER_ORIGINAL_ARTIST)

  const handleValueChange = useCallback(() => {
    if (isCover) {
      setOriginalSongTitle(null)
      setOriginalArtist(null)
    }
    setIsCover(!isCover)
  }, [isCover, setOriginalSongTitle, setOriginalArtist, setIsCover])

  return (
    <FormScreen title={messages.title} variant='white'>
      <Box ph='xl' mt='xl'>
        <Box>
          <Flex
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            mb='s'
          >
            <Text variant='title'>{messages.cover}</Text>
            <Switch value={isCover} onValueChange={handleValueChange} />
          </Flex>
          <Text variant='body'>{messages.description}</Text>
        </Box>

        {isCover ? (
          <Box>
            <Divider mt='xl' />
            <Box mt='xl'>
              <Text variant='body'>{messages.attribution.header}</Text>
              <Box mt='xl' mb='m'>
                <TextField
                  label={messages.attribution.originalSongTitle}
                  name={COVER_ORIGINAL_SONG_TITLE}
                  placeholder={messages.attribution.originalSongTitle}
                  value={originalSongTitle ?? ''}
                />
              </Box>
              <Box>
                <TextField
                  label={messages.attribution.originalArtist}
                  name={COVER_ORIGINAL_ARTIST}
                  placeholder={messages.attribution.originalArtist}
                  value={originalArtist ?? ''}
                />
              </Box>
            </Box>
          </Box>
        ) : null}
      </Box>
    </FormScreen>
  )
}
