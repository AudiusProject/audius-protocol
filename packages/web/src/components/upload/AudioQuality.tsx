import { Flex, Text } from '@audius/harmony'

import styles from './AudioQuality.module.css'

const messages = {
  lossless: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality.',
  learnMore: 'Learn more about lossless HD.'
}

export const AudioQuality = () => {
  return (
    <Flex justifyContent='center' alignItems='center'>
      <Text variant='body'>{messages.lossless}</Text>
      &nbsp;
      <a className={styles.learnMore} href='' target='_blank'>
        {messages.learnMore}
      </a>
    </Flex>
  )
}
