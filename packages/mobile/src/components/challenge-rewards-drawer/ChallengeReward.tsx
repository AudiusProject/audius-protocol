import { formatNumberCommas } from '@audius/common/utils'
import { View } from 'react-native'

import { GradientText, Text } from '../core'

import { useStyles } from './styles'

const messages = {
  reward: 'Reward'
}

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
