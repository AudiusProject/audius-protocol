import { formatNumberCommas } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'

import styles from './styles.module.css'

/** Renders the box containing the amount of audio to be earned from the challenge */
export const ProgressReward = ({
  amount,
  subtext
}: {
  amount?: number
  subtext: string
}) => {
  return (
    <Flex p='xl' column>
      <Text
        variant='display'
        strength='strong'
        className={styles.rewardAmount}
        textAlign='center'
      >
        {formatNumberCommas(amount ?? '')}
      </Text>
      <Text variant='label' size='l' color='subdued' textAlign='center'>
        {subtext}
      </Text>
    </Flex>
  )
}
