import { BadgeTier } from 'audius-client/src/common/models/BadgeTier'
import { TierChange as TierChangeNotification } from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from 'app/utils/theme'

import TwitterShare from './TwitterShare'

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  text: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16,
    marginBottom: 8
  }
})

export const tierInfoMap: Record<BadgeTier, { label: string; amount: number }> =
  {
    none: {
      amount: 0,
      label: 'None'
    },
    bronze: {
      amount: 10,
      label: 'Bronze'
    },
    silver: {
      amount: 100,
      label: 'Silver'
    },
    gold: {
      amount: 10000,
      label: 'Gold'
    },
    platinum: {
      amount: 100000,
      label: 'Platinum'
    }
  }

type TierChangeProps = {
  notification: TierChangeNotification
}

const TierChange = ({ notification }: TierChangeProps) => {
  const { tier } = notification

  const textStyle = useTheme(styles.text, {
    color: 'neutral'
  })

  const notifText = `Congrats, you’ve reached ${tierInfoMap[tier].label} Tier by having over ${tierInfoMap[tier].amount} $AUDIO! You now have access to exclusive features & a shiny new badge by your name.`

  return (
    <View style={styles.wrapper}>
      <Text style={textStyle}>{notifText}</Text>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default TierChange
