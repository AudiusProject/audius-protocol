import { useCallback, useContext } from 'react'

import type { BNWei, Chain } from '@audius/common'
import { formatWei, tokenDashboardPageActions } from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'

import IconCopy from 'app/assets/images/iconCopy.svg'
import IconRemoveTrack from 'app/assets/images/iconRemoveTrack.svg'
import { ChainLogo, IconButton, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { ToastContext } from 'app/components/toast/ToastContext'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useCanConnectNewWallet } from '../useCanConnectNewWallet'

const { requestRemoveWallet } = tokenDashboardPageActions

const messages = {
  copied: 'Copied To Clipboard!'
}

type WalletProps = {
  chain: Chain
  address: string
  audioBalance: BNWei
  isLoading: boolean
}

const useStyles = makeStyles(({ spacing, palette }) => ({
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
  chainIcon: {
    marginRight: spacing(2)
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  copyIcon: {
    marginBottom: spacing(0.5),
    marginLeft: 10
  },
  audioAmount: {
    marginRight: spacing(2)
  },
  statusSection: {
    marginLeft: spacing(2),
    padding: spacing(3)
  },
  iconContainer: {
    backgroundColor: palette.neutralLight10,
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: 6
  },
  removeIcon: {
    height: 20,
    width: 20
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

  const canConnectNewWallet = useCanConnectNewWallet()

  return (
    <View style={styles.linkedWallet}>
      <View style={styles.linkedWalletData}>
        <View style={styles.linkedWalletKey}>
          <ChainLogo chain={chain} style={styles.chainIcon} />
          <TouchableOpacity style={styles.address} onPress={handlePressAddress}>
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
        <Text style={styles.audioAmount}>{formatWei(audioBalance, true)}</Text>
      </View>
      {isLoading ? (
        <View style={styles.statusSection}>
          <LoadingSpinner style={styles.loading} />
        </View>
      ) : (
        <IconButton
          isDisabled={!canConnectNewWallet}
          icon={IconRemoveTrack}
          styles={{
            root: [styles.statusSection, styles.iconContainer],
            icon: styles.removeIcon
          }}
          onPress={onRequestRemoveWallet}
        />
      )}
    </View>
  )
}
