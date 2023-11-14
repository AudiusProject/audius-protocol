import { Text } from 'components/typography'

import styles from './AudioMatchSection.module.css'

const messages = {
  earn: (amount: string) => `Earn ${amount} $AUDIO when you buy this track!`
}

type AudioMatchSectionProps = {
  amount: string
}

export const AudioMatchSection = ({ amount }: AudioMatchSectionProps) => {
  return (
    <div className={styles.root}>
      <Text variant='label' size='large' color='staticWhite'>
        {messages.earn(amount)}
      </Text>
    </div>
  )
}
