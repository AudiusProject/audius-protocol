import type { BNWei } from '@audius/common'
import { Chain, formatWei, tokenDashboardPageSelectors } from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { Divider, FlatList, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const { getAssociatedWallets } = tokenDashboardPageSelectors

const messages = {
  linkedWallets: 'Linked Wallets',
  audio: '$AUDIO'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(6)
  },
  linkedWalletsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing(2)
  },
  divider: {
    marginVertical: spacing(2)
  },
  linkedWallet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  linkedWalletKey: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 150
  },
  linkedWalletLogo: {
    marginRight: spacing(2)
  },
  chainIcon: {
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: 14,
    padding: 2,
    marginRight: spacing(2)
  },
  audioAmount: {
    marginRight: spacing(2)
  }
}))

type WalletProps = {
  chain: Chain
  address: string
  audioBalance: BNWei
}

const Wallet = ({ chain, address, audioBalance }: WalletProps) => {
  const styles = useStyles()

  return (
    <View style={styles.linkedWallet}>
      <View style={styles.linkedWalletKey}>
        <View style={styles.chainIcon}>
          {chain === Chain.Eth ? (
            <LogoEth height={spacing(5)} width={spacing(5)} />
          ) : (
            <LogoSol height={spacing(5)} width={spacing(5)} />
          )}
        </View>
        <Text ellipsizeMode='middle' numberOfLines={1}>
          {address}
        </Text>
      </View>
      <Text style={styles.audioAmount}>{formatWei(audioBalance, true)}</Text>
    </View>
  )
}

export const LinkedWallets = () => {
  const styles = useStyles()

  const { connectedEthWallets, connectedSolWallets } =
    useSelector(getAssociatedWallets)

  const wallets = [
    ...(connectedEthWallets
      ? connectedEthWallets.map((wallet) => ({ ...wallet, chain: Chain.Eth }))
      : []),
    ...(connectedSolWallets
      ? connectedSolWallets.map((wallet) => ({ ...wallet, chain: Chain.Sol }))
      : [])
  ]

  return (
    <View style={styles.root}>
      <View style={styles.linkedWalletsHeader}>
        <Text
          fontSize='small'
          textTransform='uppercase'
          weight='bold'
          color='neutralLight4'
        >
          {messages.linkedWallets}
        </Text>
        <Text
          fontSize='small'
          textTransform='uppercase'
          weight='bold'
          color='neutralLight4'
        >
          {messages.audio}
        </Text>
      </View>
      <Divider style={styles.divider} />
      <FlatList
        renderItem={({ item }) => (
          <Wallet
            chain={item.chain}
            address={item.address}
            audioBalance={item.balance}
          />
        )}
        data={wallets}
      />
    </View>
  )
}
