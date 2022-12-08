import { useCallback } from 'react'

import type { WalletService } from '@walletconnect/react-native-dapp'
import { useWalletConnectContext } from '@walletconnect/react-native-dapp'
import { Image } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  setConnectionStatus,
  setConnectionType
} from 'app/store/wallet-connect/slice'
import { makeStyles } from 'app/styles'

import { WalletConnectOption } from './WalletConnectOption'

type EthWalletConnectOptionProps = {
  walletService: WalletService
  uri: string
}

const useStyles = makeStyles(() => ({
  walletImage: {
    height: 50,
    width: 50,
    borderRadius: 25
  }
}))

export const EthWalletConnectOption = (props: EthWalletConnectOptionProps) => {
  const { walletService, uri } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const context = useWalletConnectContext()
  const { connectToWalletService } = context

  const handleConnectWallet = useCallback(() => {
    dispatch(setConnectionType({ connectionType: 'wallet-connect' }))
    dispatch(setConnectionStatus({ status: 'connecting' }))
    connectToWalletService?.(walletService, uri)
  }, [dispatch, walletService, connectToWalletService, uri])

  return (
    <WalletConnectOption
      name={walletService.name}
      icon={
        <Image
          style={styles.walletImage}
          source={{
            // @ts-ignore: image_url is valid
            uri: `${walletService.image_url.sm}`
          }}
        />
      }
      onPress={handleConnectWallet}
    />
  )
}
