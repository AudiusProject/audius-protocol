import { useCallback, useContext, useEffect, useRef, useState } from 'react'

import {
  useAddConnectedWallet,
  useConnectedWallets,
  useRemoveConnectedWallet,
  type ConnectedWallet
} from '@audius/common/api'
import { useAppContext } from '@audius/common/context'
import { Chain, Name } from '@audius/common/models'
import { useCurrentUser } from '@audius/common/src/api/tan-query/useCurrentUser'
import { useConnectedWalletsModal } from '@audius/common/store'
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
import { mainnet } from '@reown/appkit/networks'
import {
  useAppKit,
  useAppKitState,
  useDisconnect,
  type NamespaceTypeMap
} from '@reown/appkit/react'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import type { Hex } from 'viem'
import { useAccount, useSignMessage, useSwitchAccount } from 'wagmi'

import { wagmiAdapter, appkitModal, audiusChain } from 'app/ReownAppKitModal'
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
  error: 'Something went wrong. Please try again.',
  walletAlreadyAdded: 'No new wallets selected to connect.'
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
        const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
        if (!solanaProvider) {
          throw new Error('Missing SolanaProvider')
        }
        console.debug('[associate-wallet]', 'Signing with SolanaProvider...')
        const encodedMessage = new TextEncoder().encode(message)
        const signatureBytes = await solanaProvider.signMessage(encodedMessage)
        return Buffer.from(signatureBytes).toString('hex')
      } else {
        console.debug('[associate-wallet]', 'Signing with Wagmi...')
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

class AlreadyAssociatedError extends Error {
  name = 'AlreadyAssociatedError'
}

/**
 * A wrapper around addConnectedWallet that handles actually connecting
 * the wallets using AppKit's modal. Once AppKit fires the success event,
 * it then gets signatures from all the connected wallets for the
 * addConnectedWallet mutation, which it then calls for each connected wallet.
 *
 * - Existing connected wallets (including the auth wallet) are not re-added
 * - The AppKit modal matches the theme and is configured properly
 * - Works when a use is signed in using an external wallet
 * - Handles when the user selects more than one wallet to connect at a time
 *
 * @param onSuccess handler for when wallets are successfully associated
 * @param onError handler for when something goes wrong
 *
 * @returns a callback for opening the AppKit modal, and an `isPending` flag
 * which is true when a wallet is in the process of being associated.
 */
const useConnectAndAssociateWallets = (
  onSuccess?: (wallets: ConnectedWallet[]) => void,
  onError?: (error: unknown) => void
) => {
  const {
    analytics: { track, make }
  } = useAppContext()
  const theme = useTheme()
  const { open } = useAppKit()
  const { signMessageAgnostic } = useSignMessageAgnostic()
  const currentUser = useCurrentUser()
  const { data: connectedWallets } = useConnectedWallets()
  const { switchAccountAsync } = useSwitchAccount()
  const { disconnect } = useDisconnect()

  // The state goes from modal open => connecting => associating
  const { open: isAppKitModalOpen } = useAppKitState()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAssociating, setIsAssociating] = useState(false)

  // Keep track of any existing connected external wallets
  const { isConnected, connector, chainId } = useAccount()
  const originalConnectorRef = useRef(connector)
  const originalChainIdRef = useRef(chainId)
  const usingExternalWalletAuthRef = useRef(
    !!originalConnectorRef.current &&
      originalChainIdRef.current === audiusChain.id
  )

  const { mutateAsync: addConnectedWalletAsync } = useAddConnectedWallet()

  /**
   * Opens the AppKit Modal to the wallet connect screen.
   * - Ensures the UI matches the app theme
   * - Ensures only external wallets are allowed
   * - Ensures all existing connections are disconnected
   * - Ensures that the network is set to mainnet (for Eth)
   */
  const openAppKitModal = useCallback(async () => {
    // If previously connected, disconnect to give a "fresh" view of options
    if (isConnected) {
      await disconnect()
    }
    appkitModal.updateFeatures({ socials: false, email: false })
    appkitModal.setThemeMode(theme.type === 'day' ? 'light' : 'dark')
    // If the user is signed in using an external wallet, they'll be connected
    // to the audiusChain network. Reset that to mainnet to connect properly.
    await appkitModal.switchNetwork(mainnet)
    await open({ view: 'Connect' })
  }, [disconnect, isConnected, open, theme.type])

  /**
   * Reconnects to the external auth wallet connector if the user wallet isn't
   * one of the connected accounts or if the chain ID doesn't match Audius
   */
  const reconnectExternalAuthWallet = useCallback(async () => {
    if (usingExternalWalletAuthRef.current && originalConnectorRef.current) {
      const connector = originalConnectorRef.current
      const accounts = await connector!.getAccounts()
      const chainId = await connector!.getChainId()
      const connectedAccountIsUserWallet =
        accounts &&
        accounts[0]?.toLowerCase() === currentUser.data?.wallet?.toLowerCase()
      if (!connectedAccountIsUserWallet || chainId !== audiusChain.id) {
        console.debug(
          '[associate-wallet]',
          'Reconnecting to external auth wallet...'
        )
        await connector.connect({
          chainId: audiusChain.id
        })
        await switchAccountAsync({ connector })
      }
    }
  }, [currentUser.data?.wallet, switchAccountAsync])

  /**
   * Associates any Reown connected wallets to the user's account.
   * Handles reconnecting to external wallet if used for auth.
   */
  const associateConnectedWallets = useCallback(async () => {
    try {
      setIsAssociating(true)
      await track(make({ eventName: Name.CONNECT_WALLET_NEW_WALLET_START }))
      const activeAccount = appkitModal.getAccount()
      const originalAddress = currentUser?.data?.wallet

      // Map the wallets to add our chain format
      const wallets =
        activeAccount?.allAccounts.map((a) => ({
          ...a,
          chain: a.namespace === 'eip155' ? Chain.Eth : Chain.Sol
        })) ?? []

      // Filter out the user's auth wallet and any already connected wallets
      const filteredWallets = wallets?.filter(
        (w) =>
          w.address.toLowerCase() !== originalAddress?.toLocaleLowerCase() &&
          !connectedWallets?.find((w2) => w2.address === w.address)
      )
      console.debug(
        '[associate-wallet]',
        'Wallets to associate:',
        filteredWallets
      )

      // Ensure there are wallets to associate
      if (filteredWallets.length === 0) {
        if (wallets.length > 0) {
          for (const { chain, address } of wallets) {
            await track(
              make({
                eventName: Name.CONNECT_WALLET_ALREADY_ASSOCIATED,
                chain,
                walletAddress: address
              })
            )
          }
          throw new AlreadyAssociatedError('Wallets already added')
        } else {
          throw new Error('No wallets selected')
        }
      }

      // Gather all signatures while connected
      const signatures = []
      for (const { address, chain, namespace } of filteredWallets) {
        console.debug('[associate-wallet]', 'Getting wallet signature', {
          address,
          chain
        })
        await track(
          make({
            eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTING,
            chain,
            walletAddress: address
          })
        )
        const signature = await signMessageAgnostic(
          `AudiusUserID:${currentUser.data?.user_id}`,
          address,
          namespace
        )
        signatures.push({ address, chain, signature })
      }

      // Reconnect to original external wallet if necessary
      await reconnectExternalAuthWallet()

      // Send transactions via SDK to the network to add the association
      for (const { address, chain, signature } of signatures) {
        console.debug('[associate-wallet]', 'Associating wallet...', {
          address,
          chain
        })
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

      // DONE!
      onSuccess?.(filteredWallets)
    } catch (e) {
      await track(
        make({ eventName: Name.CONNECT_WALLET_ERROR, error: String(e) })
      )
      onError?.(e)
    } finally {
      setIsAssociating(false)
      await reconnectExternalAuthWallet()
    }
  }, [
    addConnectedWalletAsync,
    connectedWallets,
    currentUser.data?.user_id,
    currentUser.data?.wallet,
    make,
    onError,
    onSuccess,
    reconnectExternalAuthWallet,
    signMessageAgnostic,
    track
  ])

  /**
   * Handle events from the modal.
   * Typical flow is:
   * 1) SELECT_WALLET: The user has selected wallet(s) to connect
   * 2) MODAL_CLOSE: The modal was closed (it closes automatically after selection)
   * 3) CONNECT_SUCCESS || CONNECT_ERROR: The selected wallet(s) were connected,
   *    or failed to connect.
   */
  useEffect(() => {
    return appkitModal.subscribeEvents(async (event) => {
      if (event.data.event === 'SELECT_WALLET') {
        setIsConnecting(true)
      } else if (event.data.event === 'MODAL_CLOSE') {
        if (!isConnecting && !isAssociating) {
          await reconnectExternalAuthWallet()
        }
      } else if (event.data.event === 'CONNECT_SUCCESS') {
        setIsConnecting(false)
        await associateConnectedWallets()
      } else if (event.data.event === 'CONNECT_ERROR') {
        setIsConnecting(false)
      }
    })
  }, [
    associateConnectedWallets,
    reconnectExternalAuthWallet,
    isConnecting,
    isAssociating
  ])

  return {
    isPending: isAppKitModalOpen || isConnecting || isAssociating,
    openAppKitModal
  }
}

enum Pages {
  TABLE = 0,
  CONFIRM_REMOVE_WALLET = 1
}

export const ConnectedWalletsModal = () => {
  const { isOpen, onClose, onClosed } = useConnectedWalletsModal()
  const { toast } = useContext(ToastContext)

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

  const {
    mutateAsync: removeConnectedWalletAsync,
    isPending: isRemovePending
  } = useRemoveConnectedWallet()

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
      toast(messages.walletRemoved, NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS)
    } catch (e) {
      if (e instanceof Error) {
        toast(messages.error)
      }
    }
  }, [removeConnectedWalletAsync, toast, walletToRemove])

  const handleIgnoreClicked = useCallback(() => setCurrentPage(Pages.TABLE), [])

  const handleAddWalletSuccess = useCallback(() => {
    toast(messages.newWalletConnected)
  }, [toast])

  const handleAddWalletError = useCallback(
    async (e: unknown) => {
      if (e instanceof AlreadyAssociatedError) {
        toast(messages.walletAlreadyAdded)
      } else {
        toast(messages.error)
        await reportToSentry({
          name: 'ConnectWallet',
          error:
            e instanceof Error
              ? e
              : new Error(
                  e instanceof Object && 'message' in e
                    ? (e.message as string)
                    : 'Unknown Error'
                ),
          additionalInfo: {
            raw: e
          }
        })
      }
    },
    [toast]
  )

  const { openAppKitModal, isPending: isConnectingWallets } =
    useConnectAndAssociateWallets(handleAddWalletSuccess, handleAddWalletError)

  const numConnectedWallets = connectedWallets?.length ?? 0
  const hasReachedLimit = numConnectedWallets >= WALLET_COUNT_LIMIT
  const isMutationPending = isConnectingWallets || isRemovePending
  const isConnectDisabled =
    hasReachedLimit || isMutationPending || isConnectingWallets

  return (
    <Modal
      size='small'
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      dismissOnClickOutside={!isConnectingWallets}
    >
      <ModalHeader>
        <ModalTitle
          Icon={IconWallet}
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
            isLoading={isConnectingWallets}
            onClick={openAppKitModal}
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
