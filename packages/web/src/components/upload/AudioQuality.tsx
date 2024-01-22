import { Flex, Text, TextLink } from '@audius/harmony'

const messages = {
  lossless: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality. ',
  learnMore: 'Learn more about lossless HD.'
}

export const AudioQuality = () => {
  return (
    <Flex justifyContent='center' alignItems='center' mh='3xl'>
      <Text variant='body'>
        {messages.lossless}
        <TextLink href='' target='_blank' isExternal css={{ color: '#a30cb3' }}>
          {messages.learnMore}
        </TextLink>
      </Text>
    </Flex>
  )
}
