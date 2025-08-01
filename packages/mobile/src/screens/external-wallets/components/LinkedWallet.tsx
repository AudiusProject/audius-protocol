import { useCallback } from 'react'

import type { Chain } from '@audius/common/models'
import { tokenDashboardPageActions } from '@audius/common/store'
import { AUDIO } from '@audius/fixed-decimal'
import Clipboard from '@react-native-clipboard/clipboard'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'

import { IconButton, IconCopy, IconRemove } from '@audius/harmony-native'
import { ChainLogo, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDrawer } from 'app/hooks/useDrawer'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { useCanConnectNewWallet } from '../useCanConnectNewWallet'

const { requestRemoveWallet } = tokenDashboardPageActions

const messages = {
  copied: 'Copied To Clipboard!',
  removeLabel: 'Remove Wallet'
}

type WalletProps = {
  chain: Chain
  address: string
  audioBalance: bigint
  isLoading: boolean
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  linkedWallet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(6)
  },
  linkedWalletData: {
    flex: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  linkedWalletKey: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  linkedWalletLogo: {
    marginRight: spacing(2)
  },
  chainIcon: {
    marginRight: spacing(2)
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addressText: {
    maxWidth: 125
  },
  copyIcon: {
    marginBottom: spacing(0.5),
    marginLeft: spacing(1)
  },
  audioAmount: {
    flex: 2,
    textAlign: 'right'
  },
  statusSection: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 42
  },
  removeButton: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    backgroundColor: palette.neutralLight10,
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: 6
  },
  loading: {
    marginLeft: -1,
    height: 22,
    width: 22
  }
}))

export const LinkedWallet = ({
  chain,
  address,
  audioBalance,
  isLoading
}: WalletProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { toast } = useToast()
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

  const canConnectNewWallet = useCanConnectNewWallet()

  return (
    <View style={styles.linkedWallet}>
      <View style={styles.linkedWalletData}>
        <View style={styles.linkedWalletKey}>
          <ChainLogo chain={chain} style={styles.chainIcon} size={spacing(8)} />
          <TouchableOpacity style={styles.address} onPress={handlePressAddress}>
            <Text
              fontSize='medium'
              weight='demiBold'
              ellipsizeMode='middle'
              numberOfLines={1}
              style={styles.addressText}
            >
              {address}
            </Text>
            <IconCopy
              fill={neutralLight4}
              style={styles.copyIcon}
              height={spacing(4)}
              width={spacing(4)}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.audioAmount}>
        {AUDIO(audioBalance).toLocaleString()}
      </Text>
      <View style={styles.statusSection}>
        {isLoading ? (
          <LoadingSpinner style={styles.loading} />
        ) : (
          <IconButton
            disabled={!canConnectNewWallet}
            color='danger'
            icon={IconRemove}
            style={styles.removeButton}
            onPress={onRequestRemoveWallet}
            aria-label={messages.removeLabel}
          />
        )}
      </View>
    </View>
  )
}
