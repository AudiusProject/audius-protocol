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
    // TODO: This renders incorrectly for matching. Want to find a way to let this render centered in its container but left-justify for the versions which have two-column layouts
    <View style={styles.rewardCell}>
      <Text
        style={styles.subheader}
        color='neutralLight4'
        weight='heavy'
        textTransform='uppercase'
      >
        {messages.reward}
      </Text>
      <GradientText style={styles.audioAmount}>
        {formatNumberCommas(amount)}
      </GradientText>
      <Text
        style={styles.audioLabel}
        weight='heavy'
        color='neutralLight4'
        textTransform='uppercase'
      >
        {subtext}
      </Text>
    </View>
  )
}
