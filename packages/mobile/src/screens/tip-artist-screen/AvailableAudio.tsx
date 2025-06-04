import { useAudioBalance } from '@audius/common/api'
import type { BNWei, StringWei } from '@audius/common/models'
import {
  isNullOrUndefined,
  formatWei,
  stringWeiToBN
} from '@audius/common/utils'
import { Image, Platform, View } from 'react-native'

import TokenBadgeNoTier from 'app/assets/images/tokenBadgeNoTier.png'
import { Text } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

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
  disclaimer: '$AUDIO held in linked wallets cannot be used to tip',
  // NOTE: Send tip -> Send $AUDIO change
  disclaimerAlt: 'Cannot use $AUDIO held in linked wallets' // iOS only
}

export const AvailableAudio = () => {
  // Use the new useAudioBalance hook, excluding connected wallets since they can't be used for tipping
  const { accountBalance: audioBalanceBigInt, isLoading: isBalanceLoading } =
    useAudioBalance({
      includeConnectedWallets: false
    })

  // Convert BigInt to BN for compatibility with existing code
  const accountBalance = audioBalanceBigInt
    ? stringWeiToBN(audioBalanceBigInt.toString() as StringWei)
    : null

  const styles = useStyles()

  return (
    <View style={styles.root}>
      <View style={styles.availableAudio}>
        <Text variant='body' style={styles.text}>
          {messages.available}
        </Text>
        <Image style={styles.audioToken} source={TokenBadgeNoTier} />
        {isBalanceLoading || isNullOrUndefined(accountBalance) ? (
          <Skeleton width={24} height={13} />
        ) : (
          <Text variant='body' style={styles.text}>
            {formatWei(accountBalance as BNWei, true, 0)}
          </Text>
        )}
      </View>
      <Text variant='body2' color='neutralLight4'>
        {Platform.OS === 'ios' ? messages.disclaimerAlt : messages.disclaimer}
      </Text>
    </View>
  )
}
