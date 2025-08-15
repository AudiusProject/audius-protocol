import { useRef, useCallback, useEffect } from 'react'

import {
  type ConnectedWallet,
  useConnectedWallets,
  useAddConnectedWallet,
  useCurrentAccountUser
} from '@audius/common/api'
import { useAppContext } from '@audius/common/context'
import { Name, Chain } from '@audius/common/models'
import { useTheme } from '@emotion/react'
import type { NamespaceTypeMap } from '@reown/appkit'
import { mainnet } from '@reown/appkit/networks'
import { useAppKit, useAppKitState, useDisconnect } from '@reown/appkit/react'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import type { Hex } from 'viem'
import { useSignMessage, useSwitchAccount, useAccount } from 'wagmi'

import { appkitModal, wagmiAdapter, audiusChain } from 'app/ReownAppKitModal'

import { useRequiresAccountCallback } from './useRequiresAccount'

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

/**
 * Error when trying to associate a wallet that was already associated
 */
export class AlreadyAssociatedError extends Error {
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
export const useConnectAndAssociateWallets = (
  onSuccess?: (wallets: ConnectedWallet[]) => void,
  onError?: (error: unknown) => void
) => {
  const {
    analytics: { track, make }
  } = useAppContext()
  const theme = useTheme()
  const { open } = useAppKit()
  const { signMessageAgnostic } = useSignMessageAgnostic()
  const { data: currentUser } = useCurrentAccountUser()
  const { data: connectedWallets } = useConnectedWallets()
  const { switchAccountAsync } = useSwitchAccount()
  const { disconnect } = useDisconnect()

  // The state goes from modal open => connecting => associating
  const { open: isAppKitModalOpen } = useAppKitState()
  const isConnectingRef = useRef(false)
  const isAssociatingRef = useRef(false)

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
  const openAppKitModal = useRequiresAccountCallback(async () => {
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
        accounts[0]?.toLowerCase() === currentUser?.wallet?.toLowerCase()
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
  }, [currentUser?.wallet, switchAccountAsync])

  /**
   * Associates any Reown connected wallets to the user's account.
   * Handles reconnecting to external wallet if used for auth.
   */
  const associateConnectedWallets = useCallback(async () => {
    try {
      isAssociatingRef.current = true
      track(make({ eventName: Name.CONNECT_WALLET_NEW_WALLET_START }))
      const activeAccount = appkitModal.getAccount()
      const originalAddress = currentUser?.wallet

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
            track(
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
        track(
          make({
            eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTING,
            chain,
            walletAddress: address
          })
        )
        const signature = await signMessageAgnostic(
          `AudiusUserID:${currentUser?.user_id}`,
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
        track(
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
      track(make({ eventName: Name.CONNECT_WALLET_ERROR, error: String(e) }))
      onError?.(e)
    } finally {
      isAssociatingRef.current = false
      await reconnectExternalAuthWallet()
    }
  }, [
    addConnectedWalletAsync,
    connectedWallets,
    currentUser?.user_id,
    currentUser?.wallet,
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
        isConnectingRef.current = true
      } else if (event.data.event === 'MODAL_CLOSE') {
        if (!isConnectingRef.current && !isAssociatingRef.current) {
          await reconnectExternalAuthWallet()
        }
      } else if (event.data.event === 'CONNECT_SUCCESS') {
        isConnectingRef.current = false
        await associateConnectedWallets()
      } else if (event.data.event === 'CONNECT_ERROR') {
        isConnectingRef.current = false
      }
    })
  }, [associateConnectedWallets, reconnectExternalAuthWallet])

  return {
    isPending:
      isAppKitModalOpen || isConnectingRef.current || isAssociatingRef.current,
    openAppKitModal
  }
}
