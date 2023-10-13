import { formatNumberCommas } from '@audius/common'
import { View } from 'react-native'

import { GradientText, Text } from '../core'

import { useStyles } from './styles'

const messages = {
  reward: 'Reward'
}

export const ChallengeReward = ({
  amount,
  subtext
}: {
  amount: number
  subtext: string
}) => {
  const styles = useStyles()
  return (
    <View style={styles.rewardCell}>
      <Text style={styles.subheader} weight='heavy'>
        {messages.reward}
      </Text>
      <GradientText style={styles.audioAmount}>
        {formatNumberCommas(amount)}
      </GradientText>
      <Text style={styles.audioLabel} weight='heavy'>
        {subtext}
      </Text>
    </View>
  )
}
