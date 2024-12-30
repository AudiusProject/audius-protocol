import { Flex, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

import styles from './styles.module.css'

const messages = {
  reward: 'Reward'
}

/** Renders the box containing the amount of audio to be earned from the challenge */
export const ProgressReward = ({
  amount,
  subtext
}: {
  amount: string
  subtext: string
}) => {
  const isMobile = useIsMobile()
  return (
    <Flex
      p='xl'
      column
      borderLeft={isMobile ? undefined : 'strong'}
      css={{
        textAlign: 'center',
        maxWidth: 200
      }}
    >
      <Text variant='label' size='l' strength='strong' color='subdued'>
        {messages.reward}
      </Text>
      <Text variant='display' className={styles.rewardAmount}>
        {amount}
      </Text>
      <Text variant='label' size='s' strength='strong' color='subdued'>
        {subtext}
      </Text>
    </Flex>
  )
}
