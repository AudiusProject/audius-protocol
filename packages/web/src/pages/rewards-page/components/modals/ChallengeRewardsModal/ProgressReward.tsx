import { Flex, Text } from '@audius/harmony'

import styles from './styles.module.css'

/** Renders the box containing the amount of audio to be earned from the challenge */
export const ProgressReward = ({
  amount,
  subtext
}: {
  amount: string
  subtext: string
}) => {
  return (
    <Flex
      p='xl'
      column
      css={{
        textAlign: 'center',
        maxWidth: 200
      }}
    >
      <Text variant='display' strength='strong' className={styles.rewardAmount}>
        {amount}
      </Text>
      <Text variant='label' size='l' color='subdued'>
        {subtext}
      </Text>
    </Flex>
  )
}
