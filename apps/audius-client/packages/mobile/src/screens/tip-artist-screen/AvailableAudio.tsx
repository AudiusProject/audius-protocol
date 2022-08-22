import type { BNWei } from '@audius/common'
import { formatWei, walletSelectors } from '@audius/common'
import BN from 'bn.js'
import { Image, View } from 'react-native'

import TokenBadgeNoTier from 'app/assets/images/tokenBadgeNoTier.png'
import { Text } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
const { getAccountBalance } = walletSelectors

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    marginBottom: spacing(6),
    marginHorizontal: spacing(2)
  },
  text: {
    fontFamily: typography.fontByWeight.heavy,
    textTransform: 'uppercase',
    color: palette.neutralLight4
  },
  availableAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2)
  },
  audioToken: {
    height: spacing(4),
    width: spacing(4),
    marginLeft: spacing(3),
    marginRight: spacing(1)
  }
}))

const messages = {
  available: 'Available to send',
  disclaimer: '$AUDIO held in linked wallets cannot be used to tip'
}

export const AvailableAudio = () => {
  const accountBalance = useSelectorWeb(getAccountBalance) ?? new BN(0)
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <View style={styles.availableAudio}>
        <Text variant='body' style={styles.text}>
          {messages.available}
        </Text>
        <Image style={styles.audioToken} source={TokenBadgeNoTier} />
        <Text variant='body' style={styles.text}>
          {formatWei(accountBalance as BNWei, true, 0)}
        </Text>
      </View>
      <Text variant='body2' color='neutralLight4'>
        {messages.disclaimer}
      </Text>
    </View>
  )
}
