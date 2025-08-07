import { useCallback, useContext, useMemo } from 'react'

import {
  useConnectedWallets,
  useWalletAudioBalance,
  useRemoveConnectedWallet,
  getArtistCoinQueryKey,
  getTokenBalanceQueryKey,
  QUERY_KEYS,
  useCurrentUserId
} from '@audius/common/api'
import { Chain } from '@audius/common/models'
import { getUserCoinQueryKey } from '@audius/common/src/api/tan-query/coins/useUserCoin'
import { shortenSPLAddress, shortenEthAddress } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconCopy,
  IconLogoCircleETH,
  IconLogoCircleSOL,
  IconTrash,
  IconButton,
  IconKebabHorizontal,
  Paper,
  PopupMenu,
  PopupMenuItem,
  Text,
  Box
} from '@audius/harmony'
import { useQueryClient } from '@tanstack/react-query'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ToastContext } from 'components/toast/ToastContext'
import { copyToClipboard } from 'utils/clipboardUtil'

import {
  AlreadyAssociatedError,
  useConnectAndAssociateWallets
} from '../../../hooks/useConnectAndAssociateWallets'
import styles from '../../audio-page/components/WalletsTable.module.css'
import { AssetDetailProps } from '../types'

const COPIED_TOAST_TIMEOUT = 2000

const messages = {
  title: 'Link External Wallet',
  description:
    'Link an external wallet to take advantage of in-app features, and take full control of your assets.',
  buttonText: 'Add External Wallet',
  manageWallets: 'Manage External Wallets',
  connectedWallets: 'External Wallets',
  copied: 'Copied To Clipboard!',
  audio: '$AUDIO',
  copy: 'Copy Wallet Address',
  remove: 'Remove Wallet',
  options: 'Options',
  newWalletConnected: 'New Wallet Successfully Connected!',
  walletRemoved: 'Wallet Successfully Removed!',
  error: 'Something went wrong. Please try again.',
  walletAlreadyAdded: 'No new wallets selected to connect.'
}

type WalletProps = {
  mint: string
  chain: Chain
  address: string
  isPending?: boolean
}

const WalletRow = ({
  chain,
  address,
  mint,
  isPending: isMutationPending
}: WalletProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const displayAddress =
    chain === Chain.Eth ? shortenEthAddress : shortenSPLAddress
  const { toast } = useContext(ToastContext)
  const queryClient = useQueryClient()

  const copyAddressToClipboard = useCallback(() => {
    copyToClipboard(address)
    toast(messages.copied, COPIED_TOAST_TIMEOUT)
  }, [address, toast])

  const { mutateAsync: removeConnectedWalletAsync } = useRemoveConnectedWallet()

  const handleRemove = useCallback(async () => {
    try {
      await removeConnectedWalletAsync({ wallet: { address, chain } })
      queryClient.invalidateQueries({
        queryKey: getUserCoinQueryKey(currentUserId, mint)
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.tokenBalance, mint]
      })
      toast('Wallet removed successfully!')
    } catch (e) {
      toast('Error removing wallet')
    }
  }, [
    removeConnectedWalletAsync,
    address,
    chain,
    queryClient,
    currentUserId,
    mint,
    toast
  ])

  const items: PopupMenuItem[] = useMemo(
    () => [
      {
        text: messages.copy,
        icon: <IconCopy />,
        onClick: copyAddressToClipboard
      },
      {
        text: messages.remove,
        icon: <IconTrash />,
        onClick: handleRemove
      }
    ],
    [copyAddressToClipboard, handleRemove]
  )

  const { data: audioBalance, isPending: isBalancePending } =
    useWalletAudioBalance({
      chain,
      address,
      includeStaked: true
    })

  const isPending = isBalancePending || isMutationPending

  return (
    <Flex direction='row' alignItems='center' gap='s' w='100%'>
      <Flex alignItems='center' gap='s'>
        {chain === Chain.Eth ? <IconLogoCircleETH /> : <IconLogoCircleSOL />}
        <Text variant='body' size='m' strength='strong'>
          {displayAddress(address)}
        </Text>
      </Flex>
      <Flex css={{ flex: 1 }} justifyContent='flex-end'>
        {!isPending ? (
          <Text variant='body' size='m' strength='strong'>
            {audioBalance?.toString() ?? '0'}
          </Text>
        ) : null}
      </Flex>
      <Flex pl='l' css={{ marginLeft: 'auto', flexBasis: 0 }}>
        {isPending ? (
          <LoadingSpinner css={{ width: 24, height: 24 }}></LoadingSpinner>
        ) : null}
        {!isPending ? (
          <PopupMenu
            items={items}
            renderTrigger={(ref, trigger) => (
              <IconButton
                ref={ref}
                icon={IconKebabHorizontal}
                size='s'
                color='subdued'
                onClick={() => trigger()}
                aria-label={messages.options}
              />
            )}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}

export const AssetExternalWallets = ({ mint }: AssetDetailProps) => {
  const { data: connectedWallets, isPending } = useConnectedWallets()
  const { toast } = useContext(ToastContext)
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const numConnectedWallets = connectedWallets?.length ?? 0
  const hasConnectedWallets = numConnectedWallets > 0

  const handleAddWalletSuccess = useCallback(() => {
    toast(messages.newWalletConnected)
    queryClient.invalidateQueries({
      queryKey: getUserCoinQueryKey(currentUserId, mint)
    })
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.tokenBalance, mint]
    })
  }, [toast, mint, queryClient, currentUserId])

  const handleAddWalletError = useCallback(
    async (e: unknown) => {
      if (e instanceof AlreadyAssociatedError) {
        toast(messages.walletAlreadyAdded)
      } else {
        toast(messages.error)
      }
    },
    [toast]
  )

  const { openAppKitModal, isPending: isConnectingWallets } =
    useConnectAndAssociateWallets(handleAddWalletSuccess, handleAddWalletError)

  if (isPending) {
    return (
      <Paper
        direction='column'
        alignItems='flex-start'
        backgroundColor='white'
        borderRadius='m'
        border='default'
        ph='xl'
        pv='2xl'
        gap='xl'
      >
        <Text variant='heading' size='s' color='heading'>
          {messages.title}
        </Text>
        <Text variant='body' size='m' color='subdued'>
          Loading...
        </Text>
      </Paper>
    )
  }

  return (
    <Paper
      direction='column'
      alignItems='flex-start'
      backgroundColor='white'
      borderRadius='m'
      border='default'
    >
      <Flex direction='column' pv='m' ph='l'>
        <Text variant='heading' size='s' color='heading'>
          {hasConnectedWallets ? messages.connectedWallets : messages.title}
        </Text>
        {!hasConnectedWallets && (
          <Text variant='body' size='m' color='subdued'>
            {messages.description}
          </Text>
        )}
      </Flex>

      {hasConnectedWallets ? (
        <Flex direction='column' gap='m' w='100%' pv='m' ph='l'>
          <div className={styles.container}>
            {connectedWallets?.map(
              (wallet: { address: string; chain: Chain }) => (
                <WalletRow
                  key={wallet.address}
                  chain={wallet.chain}
                  address={wallet.address}
                  mint={mint}
                />
              )
            )}
          </div>
        </Flex>
      ) : null}
      <Box pv='m' ph='l' w='100%'>
        <Button
          variant='secondary'
          size='small'
          onClick={openAppKitModal}
          isLoading={isConnectingWallets}
          disabled={isConnectingWallets}
          fullWidth
        >
          {messages.buttonText}
        </Button>
      </Box>
    </Paper>
  )
}
