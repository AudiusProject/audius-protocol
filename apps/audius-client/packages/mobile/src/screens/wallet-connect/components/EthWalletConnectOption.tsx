import { useCallback } from 'react'

import type { WalletService } from '@walletconnect/react-native-dapp'
import { useWalletConnectContext } from '@walletconnect/react-native-dapp'
import { Image } from 'react-native'
import { useDispatch } from 'react-redux'

import { setConnectionType } from 'app/store/wallet-connect/slice'
import { makeStyles } from 'app/styles'

import { WalletConnectOption } from './WalletConnectOption'

type EthWalletConnectOptionProps = {
  walletService: WalletService
}

const useStyles = makeStyles(() => ({
  walletImage: {
    height: 50,
    width: 50,
    borderRadius: 25
  }
}))

export const EthWalletConnectOption = ({
  walletService
}: EthWalletConnectOptionProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { connectToWalletService } = useWalletConnectContext()

  const handleConnectWallet = useCallback(() => {
    dispatch(setConnectionType({ connectionType: 'wallet-connect' }))
    connectToWalletService?.(walletService, 'audius://connet-wallet')
  }, [dispatch, walletService, connectToWalletService])

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
