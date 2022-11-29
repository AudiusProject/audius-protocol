import { useCallback } from 'react'

import type { BNWei } from '@audius/common'
import {
  formatWei,
  shortenEthAddress,
  shortenSPLAddress,
  Chain
} from '@audius/common'
import { Animated, TouchableWithoutFeedback, View } from 'react-native'

import IconCopy from 'app/assets/images/iconCopy.svg'
import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { Text } from 'app/components/core'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { makeStyles } from 'app/styles'
import share from 'app/utils/share'

const useSyles = makeStyles(({ palette }) => ({
  chainIconContainer: {
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: 20,
    padding: 8,
    shadowColor: palette.neutralDark1,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: {
      height: 1,
      width: 1
    },
    elevation: 5
  },
  walletRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    fontSize: 16
  },
  linkedWallet: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  walletAddress: {
    marginLeft: 16,
    fontSize: 14
  },
  linkedAmount: {
    fontSize: 14
  },
  copyIcon: {
    lineHeight: 16,
    marginBottom: 2,
    color: palette.neutralLight4,
    marginLeft: 10
  }
}))

type WalletProps = { chain: Chain; address: string; balance: BNWei }

export const Wallet = (props: WalletProps) => {
  const { chain, address, balance } = props
  // todo: use feature flag to determine whether we show sol audio
  // const { isEnabled: solWalletAudioEnabled } = useFlag(
  //   FeatureFlags.SOL_WALLET_AUDIO_ENABLED
  // )
  const solWalletAudioEnabled = false
  const styles = useSyles()

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.98)

  const displayAddress =
    chain === Chain.Eth ? shortenEthAddress : shortenSPLAddress

  const handleCopy = useCallback(() => {
    share({ url: address })
  }, [address])

  return (
    <View style={styles.walletRow}>
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <TouchableWithoutFeedback
          onPress={handleCopy}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.linkedWallet}>
            <View style={styles.chainIconContainer}>
              {chain === Chain.Eth ? (
                <LogoEth height={16} width={16} />
              ) : (
                <LogoSol height={16} width={16} />
              )}
            </View>
            <Text style={styles.walletAddress} weight='demiBold'>
              {displayAddress(address)}
            </Text>
            <IconCopy style={styles.copyIcon} height={16} width={16} />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
      {chain === Chain.Eth || solWalletAudioEnabled ? (
        <Text style={styles.linkedAmount} weight='demiBold'>
          {formatWei(balance, true)}
        </Text>
      ) : null}
    </View>
  )
}
