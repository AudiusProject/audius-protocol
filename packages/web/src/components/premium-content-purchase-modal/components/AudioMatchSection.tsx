import { Text } from 'components/typography'

import styles from './AudioMatchSection.module.css'

const messages = {
  earn: (amount: number) => `Earn ${amount} $AUDIO when you buy this track!`
}

type AudioMatchSectionProps = {
  amount: number
}

export const AudioMatchSection = ({ amount }: AudioMatchSectionProps) => {
  return (
    <div className={styles.root}>
      <Text variant='label' size='large' color='white'>
        {messages.earn(amount)}
      </Text>
    </div>
  )
}
