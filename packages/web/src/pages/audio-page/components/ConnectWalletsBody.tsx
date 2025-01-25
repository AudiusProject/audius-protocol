import { useCallback, useEffect } from 'react'

import { Status } from '@audius/common/models'
import {
  accountSelectors,
  tokenDashboardPageSelectors
} from '@audius/common/store'
import {
  Button,
  Flex,
  LoadingSpinner,
  ModalFooter,
  Text,
  useTheme
} from '@audius/harmony'
import { mainnet, solana } from '@reown/appkit/networks'
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useDisconnect,
  useWalletInfo,
  type Provider
} from '@reown/appkit/react'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { useSignMessage } from 'wagmi'

import { modal, wagmiAdapter } from 'app/AppProviders'
import { useSelector } from 'utils/reducer'

import WalletsTable from './WalletsTable'
const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors

export const WALLET_COUNT_LIMIT = 5

const messages = {
  description:
    'Connect wallets to your account to display external $AUDIO balances and showcase NFT collectibles on your profile.',
  connect: 'Connect Wallet',
  limit: `Reached Limit of ${WALLET_COUNT_LIMIT} Connected Wallets.`,
  noConnected: 'You haven’t connected any wallets yet.',
  back: 'Back'
}

const useAssociatedWallets = () => {
  const accountUserId = useSelector(accountSelectors.getUserId)
  const theme = useTheme()

  const { signMessageAsync } = useSignMessage({
    config: wagmiAdapter.wagmiConfig
  })

  const account = useAppKitAccount()
  console.log('reown', 'useAppKitAccount', { ...account })

  const { walletProvider: solanaProvider } =
    useAppKitProvider<SolanaProvider>('solana')
  console.log('reown', 'useAppKitProvider(solana)', solanaProvider)

  const { walletProvider: wagmiProvider } =
    useAppKitProvider<Provider>('eip155')
  console.log('reown', 'useAppKitProvider(eip155)', wagmiProvider)

  const { walletInfo } = useWalletInfo()
  console.log('reown', 'useWalletInfo', walletInfo)

  const network = useAppKitNetwork()
  console.log('reown', 'useAppKitNetwork', network)

  const openModal = useCallback(() => {
    modal.options.networks = [mainnet, solana]
    modal.updateFeatures({ socials: false, email: false })
    modal.setThemeMode(theme.type === 'day' ? 'light' : 'dark')
    modal.open()
  }, [theme])

  const signMessage = useCallback(async () => {
    if (account.address && account.isConnected) {
      const message = `AudiusUserID:${accountUserId}`

      if (solanaProvider) {
        const encodedMessage = new TextEncoder().encode(message)
        const signature = await solanaProvider.signMessage(encodedMessage)
        return signature
      } else {
        const signature = await signMessageAsync({ message })
        return signature
      }
    } else {
      throw new Error('No wallet connected.')
    }
  }, [
    account.address,
    account.isConnected,
    accountUserId,
    solanaProvider,
    signMessageAsync
  ])

  useEffect(() => {
    if (account.isConnected) {
      signMessage().then((signature) => console.log(signature))
    }
  }, [account.isConnected, signMessage])

  return { addAssociatedWallet: openModal }
}

const ConnectWalletsBody = ({ onClose }: { onClose: () => void }) => {
  const {
    loadingStatus,
    errorMessage,
    status,
    confirmingWallet,
    connectedEthWallets: ethWallets,
    connectedSolWallets: solWallets
  } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)
  const numConnectedWallets =
    (ethWallets?.length ?? 0) + (solWallets?.length ?? 0)
  const hasReachedLimit = numConnectedWallets >= WALLET_COUNT_LIMIT

  const isDisabled =
    removeWallets.status === 'Confirming' ||
    status === 'Connecting' ||
    status === 'Confirming'
  const isConnectDisabled = hasReachedLimit || isDisabled

  const { addAssociatedWallet } = useAssociatedWallets()

  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()

  return (
    <>
      <Flex
        direction='column'
        justifyContent='center'
        alignItems='flex-start'
        pt='xl'
        ph='2xl'
        gap='l'
      >
        <Text variant='body' size='m'>
          {messages.description}
        </Text>
        {loadingStatus === Status.SUCCESS ? (
          <>
            {(numConnectedWallets > 0 || Boolean(confirmingWallet.wallet)) && (
              <WalletsTable hasActions />
            )}
            {numConnectedWallets === 0 && !confirmingWallet.wallet ? (
              <Text variant='body' size='m' strength='strong'>
                {messages.noConnected}
              </Text>
            ) : null}
          </>
        ) : loadingStatus === Status.IDLE ||
          loadingStatus === Status.LOADING ? (
          <Flex alignItems='center' alignSelf='center'>
            <LoadingSpinner />
          </Flex>
        ) : null}
        {errorMessage && (
          <Text variant='body' color='danger'>
            {errorMessage}
          </Text>
        )}
      </Flex>
      <ModalFooter>
        <Button
          onClick={onClose}
          variant='secondary'
          isLoading={false}
          fullWidth
        >
          {messages.back}
        </Button>
        <Button
          variant='primary'
          disabled={isConnectDisabled}
          onClick={addAssociatedWallet}
          fullWidth
        >
          {messages.connect}
        </Button>
      </ModalFooter>
    </>
  )
}

export default ConnectWalletsBody
