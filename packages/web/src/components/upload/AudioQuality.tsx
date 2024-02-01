import { Flex, Text, TextLink } from '@audius/harmony'

const messages = {
  lossless: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality. ',
  learnMore: 'Learn more about lossless HD.'
}

const AUDIO_FILE_FORMATS_LINK =
  'https://support.audius.co/help/What-Audio-File-Formats-Can-I-Upload-to-Audius-ab4c8'

export const AudioQuality = () => {
  return (
    <Flex justifyContent='center' alignItems='center' mh='3xl'>
      <Text variant='body'>
        {messages.lossless}
        <TextLink
          href={AUDIO_FILE_FORMATS_LINK}
          target='_blank'
          isExternal
          css={{ color: '#a30cb3' }}
        >
          {messages.learnMore}
        </TextLink>
      </Text>
    </Flex>
  )
}
