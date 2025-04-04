import { useCallback, useContext, useState } from 'react'

import {
  useAddConnectedWallet,
  useConnectedWallets,
  useRemoveConnectedWallet
} from '@audius/common/api'
import { useAppContext } from '@audius/common/context'
import { Chain, Name } from '@audius/common/models'
import { useCurrentUser } from '@audius/common/src/api/tan-query/useCurrentUser'
import {
  accountSelectors,
  profilePageActions,
  useConnectedWalletsModal,
  walletActions
} from '@audius/common/store'
import {
  Button,
  Flex,
  IconWallet,
  LoadingSpinner,
  Modal,
  ModalContentPages,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Text,
  useTheme
} from '@audius/harmony'
import { mainnet, solana } from '@reown/appkit/networks'
import {
  useAppKitAccount,
  useDisconnect,
  type NamespaceTypeMap
} from '@reown/appkit/react'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { useDispatch, useSelector } from 'react-redux'
import type { Hex } from 'viem'
import {
  useAccount,
  useSignMessage,
  useSwitchAccount,
  useSwitchChain
} from 'wagmi'

import { wagmiAdapter, modal, audiusChain } from 'app/ReownAppKitModal'
import { ToastContext } from 'components/toast/ToastContext'
import { reportToSentry } from 'store/errors/reportToSentry'
import { NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS } from 'utils/constants'

import WalletsTable, { WalletTableRow } from '../WalletsTable'

export const WALLET_COUNT_LIMIT = 5

const messages = {
  title: 'Connected Wallets',
  description:
    'Connect wallets to your account to display external $AUDIO balances and showcase NFT collectibles on your profile.',
  connect: 'Connect Wallet',
  limit: `Reached Limit of ${WALLET_COUNT_LIMIT} Connected Wallets.`,
  noConnected: 'You haven’t connected any wallets yet.',
  back: 'Back',
  newWalletConnected: 'New Wallet Successfully Connected!',
  walletRemoved: 'Wallet Successfully Removed!',
  warning: 'Are you sure you want to remove this wallet from your account?',
  remove: 'Remove Wallet',
  ignore: 'Nevermind',
  error: 'Something went wrong. Please try again.'
}

/**
 * Helper hook that signs a message using the current connected wallet, whether
 * using Solana or Ethereum.
 */
const useSignMessageAgnostic = () => {
  const { signMessageAsync } = useSignMessage({
    config: wagmiAdapter.wagmiConfig
  })

  const signMessageAgnostic = useCallback(
    async (
      message: string,
      account: string,
      namespace: keyof NamespaceTypeMap
    ) => {
      if (namespace === 'solana') {
        const solanaProvider = modal.getProvider<SolanaProvider>('solana')
        if (!solanaProvider) {
          throw new Error('Missing SolanaProvider')
        }
        console.debug('Signing with SolanaProvider...')
        const encodedMessage = new TextEncoder().encode(message)
        const signatureBytes = await solanaProvider.signMessage(encodedMessage)
        return Buffer.from(signatureBytes).toString('hex')
      } else {
        console.debug('Signing with Wagmi...')
        return await signMessageAsync({
          account: account as Hex | undefined,
          message
        })
      }
    },
    [signMessageAsync]
  )
  return { signMessageAgnostic }
}

/**
 * Helper hook that calls into Reown's AppKit modal with the proper networks for
 * connecting external wallets (Ethereum and Solana), disabled extra features,
 * theme set to match, and screen open to connect, and waits for it to close.
 */
const useConnectWallet = () => {
  const theme = useTheme()

  const [isWalletConnecting, setIsWalletConnecting] = useState(false)

  const account = useAppKitAccount()
  const { disconnect } = useDisconnect()

  const openModal = useCallback(() => {
    modal.options.networks = [mainnet, solana]
    modal.updateFeatures({ socials: false, email: false })
    modal.setThemeMode(theme.type === 'day' ? 'light' : 'dark')
    modal.open({ view: 'Connect' })
  }, [theme])

  const connectWallet = useCallback(async () => {
    try {
      setIsWalletConnecting(true)
      if (account?.isConnected) {
        await disconnect()
      }
      openModal()
      let unsubscribeEvents: (() => void) | undefined
      await new Promise<void>((resolve, reject) => {
        const signal = AbortSignal.timeout(5 * 60 * 1000)
        signal.addEventListener('abort', () => {
          reject(signal.reason)
        })
        unsubscribeEvents = modal.subscribeEvents((newEvent) => {
          if (newEvent.data.event === 'MODAL_CLOSE') {
            if (newEvent.data.properties.connected) {
              resolve()
            } else {
              reject(new Error('MODAL_CLOSED'))
            }
          }
        })
      })
      unsubscribeEvents?.()
      const activeAccount = modal.getAccount()
      const wallets = [
        ...(activeAccount?.allAccounts.map((a) => ({
          address: a.address,
          chain: a.namespace === 'eip155' ? Chain.Eth : Chain.Sol
        })) ?? []),
        ...(activeAccount?.address && modal.getActiveChainNamespace()
          ? [
              {
                address: activeAccount.address,
                chain:
                  modal.getActiveChainNamespace() === 'eip155'
                    ? Chain.Eth
                    : Chain.Sol
              }
            ]
          : [])
      ]
      if (!wallets) {
        throw new Error(
          'Unexpected undefined address when adding associated wallet.'
        )
      }
      return wallets
    } catch (error) {
      if (error instanceof Error) {
        // Ignore the user closing the modal
        if (error.message !== 'MODAL_CLOSED') {
          reportToSentry({ error, name: 'Wallet Connect' })
        } else {
          console.debug('User cancelled the request.')
        }
      }
      throw error
    } finally {
      setIsWalletConnecting(false)
    }
  }, [account?.isConnected, disconnect, openModal])

  return { connectWallet, isWalletConnecting }
}

enum Pages {
  TABLE = 0,
  CONFIRM_REMOVE_WALLET = 1
}

export const ConnectedWalletsModal = () => {
  const { toast } = useContext(ToastContext)
  const {
    analytics: { track, make }
  } = useAppContext()
  const dispatch = useDispatch()
  const { isOpen, onClose, onClosed } = useConnectedWalletsModal()
  const { connectWallet, isWalletConnecting } = useConnectWallet()
  const { signMessageAgnostic } = useSignMessageAgnostic()
  const currentUser = useCurrentUser()
  const { switchAccountAsync } = useSwitchAccount()
  const { connector: originalConnector } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const accountUserId = useSelector(accountSelectors.getUserId)

  const [currentPage, setCurrentPage] = useState(Pages.TABLE)
  const [walletToRemove, setWalletToRemove] = useState<{
    address: string
    chain: Chain
  }>()

  const {
    data: connectedWallets,
    isPending,
    isError,
    error
  } = useConnectedWallets()

  const { mutateAsync: addConnectedWalletAsync, isPending: isAddPending } =
    useAddConnectedWallet()

  const {
    mutateAsync: removeConnectedWalletAsync,
    isPending: isRemovePending
  } = useRemoveConnectedWallet()

  const handleAddClicked = useCallback(async () => {
    try {
      const originalAddress = currentUser?.data?.wallet
      await track(make({ eventName: Name.CONNECT_WALLET_NEW_WALLET_START }))
      // 0. Disconnect from external wallet if applicable (if user is signed in with eg. Metamask)
      if (originalConnector) {
        await originalConnector.disconnect()
      }
      // 1. Connect the wallets using Reown AppKit
      const wallets = await connectWallet()
      console.debug('Wallets connected:', wallets)
      // 2. Request a signature as proof the wallet belongs to the user
      for (const { address, chain } of wallets) {
        console.debug('Adding wallet', { address, chain, originalAddress })
        // Skip the user's account address
        if (address !== originalAddress) {
          const signature = await signMessageAgnostic(
            `AudiusUserID:${accountUserId}`,
            address,
            chain === Chain.Sol ? 'solana' : 'eip155'
          )
          await track(
            make({
              eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTING,
              chain,
              walletAddress: address
            })
          )
          // 3. Swap back to original external wallet (if user is signed in with eg. Metamask)
          if (originalConnector) {
            await originalConnector.connect()
            await switchAccountAsync({ connector: originalConnector })
            await switchChainAsync({ chainId: audiusChain.id })
          }

          // 4. Send a transaction via SDK to the network to add the association
          await addConnectedWalletAsync({
            wallet: { address, chain },
            signature
          })
          await track(
            make({
              eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTED,
              chain,
              walletAddress: address
            })
          )
        }
      }
      // TODO: Update across app to show in-app balance from queryClient rather
      // than requiring this action to be dispatched to update the store.
      dispatch(walletActions.getBalance())
      // TODO: Remove the refetch of the user and refresh the collectibles directly.
      dispatch(
        profilePageActions.fetchProfile(
          null,
          accountUserId,
          false,
          false,
          false
        )
      )

      const timeout = NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS
      toast(messages.newWalletConnected, timeout)
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'MODAL_CLOSED') {
          return
        }
        await track(
          make({ eventName: Name.CONNECT_WALLET_ERROR, error: e.message })
        )
      }
      toast(messages.error)
    }
  }, [
    currentUser?.data?.wallet,
    track,
    make,
    connectWallet,
    dispatch,
    accountUserId,
    toast,
    signMessageAgnostic,
    originalConnector,
    addConnectedWalletAsync,
    switchAccountAsync
  ])

  const handleRemoveClicked = useCallback(
    (wallet: { address: string; chain: Chain }) => {
      setWalletToRemove(wallet)
      setCurrentPage(Pages.CONFIRM_REMOVE_WALLET)
    },
    []
  )

  const handleRemoveConfirmed = useCallback(async () => {
    try {
      await removeConnectedWalletAsync({ wallet: walletToRemove! })
      setCurrentPage(Pages.TABLE)

      // TODO: Update across app to show in-app balance from queryClient rather
      // than requiring this action to be dispatched to update the store.
      dispatch(walletActions.getBalance())
      // TODO: Remove the refetch of the user and refresh the collectibles directly.
      dispatch(
        profilePageActions.fetchProfile(
          null,
          accountUserId,
          false,
          false,
          false
        )
      )

      const timeout = NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS
      toast(messages.walletRemoved, timeout)
    } catch (e) {
      if (e instanceof Error) {
        toast(messages.error)
      }
    }
  }, [
    accountUserId,
    dispatch,
    removeConnectedWalletAsync,
    toast,
    walletToRemove
  ])

  const handleIgnoreClicked = useCallback(() => setCurrentPage(Pages.TABLE), [])

  const numConnectedWallets = connectedWallets?.length ?? 0
  const hasReachedLimit = numConnectedWallets >= WALLET_COUNT_LIMIT
  const isMutationPending = isAddPending || isRemovePending
  const isConnectDisabled =
    hasReachedLimit || isMutationPending || isWalletConnecting

  return (
    <Modal
      size='small'
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      dismissOnClickOutside={!isWalletConnecting}
    >
      <ModalHeader>
        <ModalTitle
          icon={<IconWallet />}
          title={currentPage === Pages.TABLE ? messages.title : messages.remove}
        />
      </ModalHeader>
      <ModalContentPages currentPage={currentPage}>
        <Flex
          direction='column'
          justifyContent='center'
          alignItems='flex-start'
          gap='l'
        >
          <Text variant='body' size='m'>
            {messages.description}
          </Text>
          {isPending ? (
            <Flex alignItems='center' alignSelf='center'>
              <LoadingSpinner />
            </Flex>
          ) : numConnectedWallets === 0 && !isMutationPending ? (
            <Text variant='body' size='m' strength='strong'>
              {messages.noConnected}
            </Text>
          ) : (
            <WalletsTable
              renderWallet={(props) => (
                <WalletTableRow
                  key={props.address}
                  {...props}
                  showActionMenu
                  onRemove={handleRemoveClicked}
                />
              )}
            />
          )}
          {isError ? (
            <Text variant='body' color='danger'>
              {error.message}
            </Text>
          ) : null}
        </Flex>
        <Flex direction='column' gap='m' alignItems='center'>
          <Text strength='strong' color='danger' textAlign='center'>
            {messages.warning}
          </Text>
          <Text>{walletToRemove?.address}</Text>
        </Flex>
      </ModalContentPages>
      {currentPage === Pages.TABLE ? (
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
            isLoading={isWalletConnecting}
            onClick={handleAddClicked}
            fullWidth
          >
            {messages.connect}
          </Button>
        </ModalFooter>
      ) : (
        <ModalFooter>
          <Button
            variant='destructive'
            isLoading={isRemovePending}
            disabled={isRemovePending}
            onClick={handleRemoveConfirmed}
          >
            {messages.remove}
          </Button>
          <Button variant='secondary' onClick={handleIgnoreClicked}>
            {messages.ignore}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}
