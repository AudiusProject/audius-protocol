import { Flex } from '@audius/harmony'

import { Text } from 'components/typography'

import styles from './AudioQuality.module.css'

const messages = {
  lossless: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality.',
  learnMore: 'Learn more about lossless HD.'
}

type AudioQualityProps = {
  className?: string
}

export const AudioQuality = ({ className }: AudioQualityProps) => {
  return (
    <Flex justifyContent='center' alignItems='center' className={className}>
      <Text>{messages.lossless}</Text>
      &nbsp;
      <a className={styles.learnMore} href='' target='_blank'>
        {messages.learnMore}
      </a>
    </Flex>
  )
}
