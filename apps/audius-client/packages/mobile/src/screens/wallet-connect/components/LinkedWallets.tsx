import { useCallback, useContext, useEffect } from 'react'

import type { AssociatedWallet, BNWei } from '@audius/common'
import {
  Chain,
  formatWei,
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import IconCopy from 'app/assets/images/iconCopy.svg'
import IconRemoveTrack from 'app/assets/images/iconRemoveTrack.svg'
import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { Divider, FlatList, IconButton, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { ToastContext } from 'app/components/toast/ToastContext'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors
const { requestRemoveWallet, resetStatus } = tokenDashboardPageActions

const messages = {
  linkedWallets: 'Linked Wallet',
  newWalletConnected: 'New Wallet Connected!',
  audio: '$AUDIO',
  copied: 'Copied To Clipboard!'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(6)
  },
  linkedWalletsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: spacing(2),
    marginRight: spacing(14)
  },
  divider: {
    marginVertical: spacing(3)
  },
  linkedWallet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  linkedWalletData: {
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: spacing(5)
  },
  linkedWalletKey: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 80
  },
  linkedWalletLogo: {
    marginRight: spacing(2)
  },
  linkedWalletActions: {
    width: spacing(7)
  },
  chainIcon: {
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: 14,
    padding: 2,
    marginRight: spacing(2)
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  copyIcon: {
    marginBottom: 2,
    marginLeft: 10
  },
  audioAmount: {
    marginRight: spacing(2)
  },
  iconContainer: {
    marginLeft: spacing(2),
    backgroundColor: palette.neutralLight10,
    padding: spacing(3),
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: 6
  },
  removeIcon: {
    height: 20,
    width: 20
  },
  loading: {}
}))

type WalletProps = {
  chain: Chain
  address: string
  audioBalance: BNWei
  isLoading: boolean
}

const Wallet = ({ chain, address, audioBalance, isLoading }: WalletProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)
  const { neutralLight4 } = useThemeColors()

  const { onOpen: onOpenConfirmationDrawer } = useDrawer('ConfirmRemoveWallet')
  const onRequestRemoveWallet = useCallback(() => {
    dispatch(requestRemoveWallet({ wallet: address, chain }))
    onOpenConfirmationDrawer()
  }, [onOpenConfirmationDrawer, dispatch, address, chain])

  const handlePressAddress = useCallback(() => {
    Clipboard.setString(address)
    toast({ content: messages.copied, type: 'info' })
  }, [toast, address])

  return (
    <>
      <Divider style={styles.divider} />
      <View style={styles.linkedWallet}>
        <View style={styles.linkedWalletData}>
          <View style={styles.linkedWalletKey}>
            <View style={styles.chainIcon}>
              {chain === Chain.Eth ? (
                <LogoEth height={spacing(5)} width={spacing(5)} />
              ) : (
                <LogoSol height={spacing(5)} width={spacing(5)} />
              )}
            </View>
            <TouchableOpacity
              style={styles.address}
              onPress={handlePressAddress}
            >
              <Text
                fontSize='medium'
                weight='demiBold'
                ellipsizeMode='middle'
                numberOfLines={1}
              >
                {address}
              </Text>
              <IconCopy
                fill={neutralLight4}
                style={styles.copyIcon}
                height={16}
                width={16}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.audioAmount}>
            {formatWei(audioBalance, true)}
          </Text>
        </View>
        {isLoading ? (
          <LoadingSpinner style={styles.loading} />
        ) : (
          <IconButton
            icon={IconRemoveTrack}
            styles={{
              root: styles.iconContainer,
              icon: styles.removeIcon
            }}
            onPress={onRequestRemoveWallet}
          />
        )}
      </View>
    </>
  )
}

export const LinkedWallets = () => {
  const styles = useStyles()

  const dispatch = useDispatch()
  const {
    status,
    confirmingWallet,
    errorMessage,
    connectedEthWallets,
    connectedSolWallets
  } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)

  const { toast } = useContext(ToastContext)

  useEffect(() => {
    if (status === 'Confirmed') {
      toast({ content: messages.newWalletConnected, type: 'info' })
      setTimeout(() => {
        dispatch(resetStatus())
      }, 2000)
      return () => {
        dispatch(resetStatus())
      }
    }
  }, [toast, dispatch, status])

  useEffect(() => {
    if (errorMessage) {
      toast({ content: errorMessage, type: 'error' })
      setTimeout(() => {
        dispatch(resetStatus())
      }, 2000)
      return () => {
        dispatch(resetStatus())
      }
    }
  }, [toast, dispatch, errorMessage])

  const wallets: Array<
    AssociatedWallet & { chain: Chain; isConfirming?: boolean }
  > = [
    ...(connectedEthWallets
      ? connectedEthWallets.map((wallet) => ({ ...wallet, chain: Chain.Eth }))
      : []),
    ...(connectedSolWallets
      ? connectedSolWallets.map((wallet) => ({ ...wallet, chain: Chain.Sol }))
      : [])
  ]
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
          fontSize='medium'
          textTransform='uppercase'
          weight='bold'
          color='neutralLight4'
        >
          {messages.linkedWallets}
        </Text>
        <Text
          fontSize='medium'
          textTransform='uppercase'
          weight='bold'
          color='neutralLight4'
        >
          {messages.audio}
        </Text>
        <View />
      </View>
      <FlatList
        renderItem={({ item }) => (
          <Wallet
            chain={item.chain}
            address={item.address}
            audioBalance={item.balance}
            isLoading={
              removeWallets.wallet === item.address || item.isConfirming
            }
          />
        )}
        data={wallets}
      />
    </View>
  )
}
