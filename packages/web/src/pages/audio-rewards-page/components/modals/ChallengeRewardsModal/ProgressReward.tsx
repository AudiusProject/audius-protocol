import { Text } from '@audius/harmony'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './styles.module.css'

const messages = {
  reward: 'Reward'
}

/** Displays the box containing the amount of audio to be earned from the challenge */
export const ProgressReward = ({
  amount,
  subtext
}: {
  amount: string
  subtext: string
}) => {
  const wm = useWithMobileStyle(styles.mobile)
  return (
    <div className={wm(styles.progressReward)}>
      <Text variant='heading'>{messages.reward}</Text>
      <Text variant='display' className={styles.rewardAmount}>
        {amount}
      </Text>
      <Text variant='label' size='s' strength='strong' color='subdued'>
        {subtext}
      </Text>
    </div>
  )
}
