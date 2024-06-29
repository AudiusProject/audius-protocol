import { Flex, Text, TextLink } from '@audius/harmony'

const messages = {
  lossless: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality. ',
  learnMore: 'Learn more about lossless HD.'
}

const AUDIO_FILE_FORMATS_LINK =
  'https://help.audius.co/help/What-Audio-File-Formats-Can-I-Upload-to-Audius-ab4c8'

export const AudioQuality = () => {
  return (
    <Flex justifyContent='center' alignItems='center' mh='3xl'>
      <Text variant='body'>
        {messages.lossless}
        <TextLink variant='visible' href={AUDIO_FILE_FORMATS_LINK} isExternal>
          {messages.learnMore}
        </TextLink>
      </Text>
    </Flex>
  )
}
