import { useCallback } from 'react'

import type { BNWei } from '@audius/common'
import { Chain } from '@audius/common'
import { getAssociatedWallets } from 'audius-client/src/common/store/pages/token-dashboard/selectors'
import type { AssociatedWallet } from 'audius-client/src/common/store/pages/token-dashboard/types'
import { getAccountBalance } from 'audius-client/src/common/store/wallet/selectors'
import {
  formatWei,
  shortenEthAddress,
  shortenSPLAddress
} from 'audius-client/src/common/utils/wallet'
import BN from 'bn.js'
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Animated
} from 'react-native'

import IconCopy from 'app/assets/images/iconCopy.svg'
import IconInfo from 'app/assets/images/iconInfo.svg'
import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import type { ThemeColors } from 'app/hooks/useThemedStyles'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import share from 'app/utils/share'

const AUDIO_BREAKDOWN_MODAL_NAME = 'AudioBreakdown'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    drawer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 24,
      paddingTop: 12,
      height: '100%'
    },

    amount: {
      fontSize: 48
    },

    total: {
      marginTop: 8,
      marginBottom: 24,
      fontSize: 18,
      color: themeColors.neutralLight4
    },

    section: {
      width: '100%',
      marginBottom: 24,
      padding: 24,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: themeColors.neutralLight7,
      backgroundColor: themeColors.neutralLight10
    },

    sectionTitle: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center'
    },

    titleLabel: {
      fontSize: 18,
      color: themeColors.neutral
    },

    titleAmount: {
      marginLeft: 12,
      fontSize: 18
    },

    sectionDescription: {
      marginTop: 12
    },

    description: {
      textAlign: 'center',
      textTransform: 'uppercase',
      color: themeColors.neutralLight4,
      fontSize: 12
    },

    chainIconContainer: {
      borderWidth: 1,
      borderColor: themeColors.neutralLight7,
      borderRadius: 20,
      padding: 8,
      shadowColor: themeColors.neutralDark1,
      shadowOpacity: 0.1,
      shadowRadius: 2,
      shadowOffset: {
        height: 1,
        width: 1
      },
      elevation: 5
    },

    infoIcon: {
      marginLeft: 8
    },

    copyIcon: {
      lineHeight: 16,
      marginBottom: 2,
      color: themeColors.neutralLight4,
      marginLeft: 10
    },

    walletsHeader: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 24,
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: 14,
      fontSize: 16
    },

    headerLabel: {
      color: themeColors.neutralLight4
    },

    walletsBody: {
      paddingLeft: 24,
      paddingRight: 24,
      borderTopWidth: 1,
      borderTopColor: themeColors.neutralLight8
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
    }
  })

const messages = {
  modalTitle: '$AUDIO BREAKDOWN',
  total: 'TOTAL $AUDIO',
  audiusWallet: 'AUDIUS WALLET',
  audiusWalletDescription: 'You can use this $AUDIO throughout the app',
  linkedWallets: 'LINKED WALLETS',
  linkedWalletsDescription:
    'Linked wallets are more secure but not all features are supported',
  linkedWalletsTooltip:
    'Linked wallets affect VIP status and NFTs. Upcoming features may require different behavior to support linked wallets. ',
  audio: '$AUDIO'
}

export const AudioBreakdownDrawer = () => {
  const styles = useThemedStyles(createStyles)

  const accountBalance = (useSelectorWeb(getAccountBalance, (a, b) =>
    Boolean(a && b && a.eq(b))
  ) ?? new BN('0')) as BNWei

  const associatedWallets = useSelectorWeb(getAssociatedWallets, isEqual)
  const { connectedEthWallets: ethWallets, connectedSolWallets: solWallets } =
    associatedWallets ?? {
      ethWallets: null,
      solWallets: null
    }

  const linkedWalletsBalance = ((ethWallets ?? [])
    .concat(solWallets ?? [])
    .reduce((total, wallet) => {
      return total.add(new BN(wallet.balance as unknown as string))
    }, new BN('0')) ?? new BN('0')) as unknown as BNWei

  const totalBalance = accountBalance.add(linkedWalletsBalance) as BNWei

  return (
    <AppDrawer
      modalName={AUDIO_BREAKDOWN_MODAL_NAME}
      title={messages.modalTitle}
      isFullscreen>
      <View style={styles.drawer}>
        <GradientText style={styles.amount}>
          {formatWei(totalBalance, true)}
        </GradientText>

        <Text style={styles.total} weight='bold'>
          {messages.total}
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.titleLabel} weight='bold'>
              {messages.audiusWallet}
            </Text>

            <GradientText style={styles.titleAmount}>
              {formatWei(accountBalance, true)}
            </GradientText>
          </View>

          <View style={styles.sectionDescription}>
            <Text style={styles.description} weight='bold'>
              {messages.audiusWalletDescription}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.titleLabel} weight='bold'>
              {messages.linkedWallets}
            </Text>

            <GradientText style={styles.titleAmount}>
              {formatWei(linkedWalletsBalance, true)}
            </GradientText>
          </View>

          <View style={styles.walletsHeader}>
            <Text style={styles.headerLabel} weight='bold'>
              {messages.linkedWallets}
            </Text>
            <Text style={styles.headerLabel} weight='bold'>
              {messages.audio}
            </Text>
          </View>

          <View style={styles.walletsBody}>
            {ethWallets &&
              ethWallets.map((wallet: AssociatedWallet) => (
                <Wallet
                  chain={Chain.Eth}
                  key={wallet.address}
                  address={wallet.address}
                  balance={wallet.balance}
                />
              ))}
            {solWallets &&
              solWallets.map((wallet: AssociatedWallet) => (
                <Wallet
                  chain={Chain.Sol}
                  key={wallet.address}
                  address={wallet.address}
                  balance={wallet.balance}
                />
              ))}
          </View>

          <View style={styles.sectionDescription}>
            <Text style={styles.description} weight='bold'>
              {messages.linkedWalletsDescription}
              <IconInfo style={styles.infoIcon} height={12} width={12} />
            </Text>
          </View>
        </View>
      </View>
    </AppDrawer>
  )
}

type WalletProps = { chain: Chain; address: string; balance: BNWei }

const Wallet = ({ chain, address, balance }: WalletProps) => {
  // todo: use feature flag to determine whether we show sol audio
  // const { isEnabled: solWalletAudioEnabled } = useFlag(
  //   FeatureFlags.SOL_WALLET_AUDIO_ENABLED
  // )
  const solWalletAudioEnabled = false
  const styles = useThemedStyles(createStyles)

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
          onPressOut={handlePressOut}>
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
      {(chain === Chain.Eth || solWalletAudioEnabled) && (
        <Text style={styles.linkedAmount} weight='demiBold'>
          {balance}
        </Text>
      )}
    </View>
  )
}
