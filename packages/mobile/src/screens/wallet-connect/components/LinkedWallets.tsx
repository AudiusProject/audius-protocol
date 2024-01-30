import type { AssociatedWallet } from '@audius/common'
import { tokenDashboardPageSelectors } from '@audius/common'
import { Chain } from '@audius/common/models'
import { FlatList, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Divider, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { LinkedWallet } from './LinkedWallet'

const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors

const messages = {
  linkedWallets: 'Linked Wallet',
  audio: '$AUDIO',
  copied: 'Copied To Clipboard!'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(6),
    flex: 1
  },
  linkedWalletsHeader: {
    paddingHorizontal: spacing(6),
    flexDirection: 'row'
  },
  linkedWalletsText: {
    flex: 6
  },
  audioAmountText: {
    flex: 2,
    textAlign: 'right'
  },
  gap: {
    flex: 2
  },
  divider: {
    marginVertical: spacing(3)
  }
}))

type LinkedWalletData = AssociatedWallet & {
  chain: Chain
  isConfirming?: boolean
}

export const LinkedWallets = () => {
  const styles = useStyles()

  const {
    confirmingWallet,
    connectedEthWallets = [],
    connectedSolWallets
  } = useSelector(getAssociatedWallets)

  // TODO C-3163 - Add loading state for loading associated wallets. Currently behaves as if you have no associated wallets until loading is finished.

  const removeWallets = useSelector(getRemoveWallet)

  const ethWallets =
    connectedEthWallets?.map((wallet) => ({ ...wallet, chain: Chain.Eth })) ??
    []

  const solWallets =
    connectedSolWallets?.map((wallet) => ({ ...wallet, chain: Chain.Sol })) ??
    []

  const wallets: LinkedWalletData[] = [...ethWallets, ...solWallets]

  if (confirmingWallet && confirmingWallet.wallet && confirmingWallet.chain) {
    wallets.push({
      chain: confirmingWallet.chain,
      address: confirmingWallet.wallet,
      balance: confirmingWallet.balance,
      collectibleCount: confirmingWallet.collectibleCount || 0,
      isConfirming: true
    })
  }

  if (!(wallets.length > 0)) {
    return null
  }

  return (
    <View style={styles.root}>
      <View style={styles.linkedWalletsHeader}>
        <Text
          style={styles.linkedWalletsText}
          fontSize='medium'
          textTransform='uppercase'
          weight='bold'
          color='neutralLight4'
        >
          {messages.linkedWallets}
        </Text>
        <Text
          style={styles.audioAmountText}
          fontSize='medium'
          textTransform='uppercase'
          weight='bold'
          color='neutralLight4'
        >
          {messages.audio}
        </Text>
        <View style={styles.gap} />
      </View>
      <Divider style={styles.divider} />
      <FlatList
        renderItem={({ item }) => (
          <LinkedWallet
            chain={item.chain}
            address={item.address}
            audioBalance={item.balance}
            isLoading={Boolean(
              removeWallets.wallet === item.address || item.isConfirming
            )}
          />
        )}
        data={wallets}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
      />
    </View>
  )
}
