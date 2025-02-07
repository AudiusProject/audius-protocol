import { formatNumberCommas } from '@audius/common/utils'

import { Flex, Text } from '@audius/harmony-native'

import { GradientText } from '../core'

import { useStyles } from './styles'

/** Renders the "Reward X Audio" content for a challenge modal */
export const ChallengeReward = ({
  amount,
  subtext
}: {
  amount: number
  subtext: string
}) => {
  const styles = useStyles()
  return (
    <Flex alignItems='center'>
      <GradientText style={styles.audioAmount}>
        {formatNumberCommas(amount)}
      </GradientText>
      <Text variant='label' size='l' color='subdued' textTransform='uppercase'>
        {subtext}
      </Text>
    </Flex>
  )
}
