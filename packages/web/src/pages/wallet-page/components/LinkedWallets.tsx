import { useCallback, useContext, useMemo, useState } from 'react'

import {
  useConnectedWallets,
  useRemoveConnectedWallet,
  QUERY_KEYS,
  useCurrentUserId
} from '@audius/common/api'
import { Chain } from '@audius/common/models'
import {
  Button,
  Flex,
  IconCopy,
  IconTrash,
  IconButton,
  IconKebabHorizontal,
  IconLogoCircle,
  IconLogoCircleETH,
  IconLogoCircleSOL,
  Paper,
  PopupMenu,
  PopupMenuItem,
  Text,
  Skeleton,
  Divider,
  useTheme
} from '@audius/harmony'
import { useQueryClient } from '@tanstack/react-query'

import { ToastContext } from 'components/toast/ToastContext'
import { copyToClipboard } from 'utils/clipboardUtil'

import {
  AlreadyAssociatedError,
  useConnectAndAssociateWallets
} from '../../../hooks/useConnectAndAssociateWallets'

const COPIED_TOAST_TIMEOUT = 2000
const WALLET_COUNT_LIMIT = 5

const messages = {
  titleHasWallets: 'Linked Wallets ',
  titleNoWallets: 'Link External Wallet',
  count: (count: number) => `(${count}/${WALLET_COUNT_LIMIT})`,
  addWallet: 'Add Linked Wallet',
  copied: 'Copied To Clipboard!',
  copy: 'Copy Address',
  remove: 'Remove Wallet',
  options: 'Options',
  newWalletConnected: 'New Wallet Successfully Connected!',
  error: 'Something went wrong. Please try again.',
  walletAlreadyAdded: 'No new wallets selected to connect.',
  linkedWallet: (index: number) => `Linked Wallet ${index + 1}`,
  linkWallet:
    'Link an external wallet to take advantage of in-app features, and take full control of your assets.',
  toasts: {
    walletRemoved: 'Wallet removed successfully!',
    error: 'Error removing wallet'
  }
}

type WalletRowProps = {
  address: string
  chain: Chain
  isInAppWallet?: boolean
  index: number
}

const WalletRow = ({
  address,
  chain,
  isInAppWallet = false,
  index
}: WalletRowProps) => {
  const { toast } = useContext(ToastContext)
  const [isRemovingWallet, setIsRemovingWallet] = useState(false)
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const copyAddressToClipboard = useCallback(() => {
    copyToClipboard(address)
    toast(messages.copied, COPIED_TOAST_TIMEOUT)
  }, [address, toast])

  const { mutateAsync: removeConnectedWalletAsync } = useRemoveConnectedWallet()

  const handleRemove = useCallback(async () => {
    try {
      setIsRemovingWallet(true)
      await removeConnectedWalletAsync({
        wallet: { address, chain: Chain.Sol }
      })
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.connectedWallets, currentUserId]
      })
      toast(messages.toasts.walletRemoved)
    } catch (e) {
      toast(messages.toasts.error)
    } finally {
      setIsRemovingWallet(false)
    }
  }, [removeConnectedWalletAsync, address, queryClient, toast, currentUserId])

  const items: PopupMenuItem[] = useMemo(
    () =>
      [
        {
          text: messages.copy,
          icon: <IconCopy />,
          onClick: copyAddressToClipboard
        },
        !isInAppWallet
          ? {
              text: messages.remove,
              icon: <IconTrash />,
              onClick: handleRemove
            }
          : null
      ].filter(Boolean) as PopupMenuItem[],
    [copyAddressToClipboard, handleRemove, isInAppWallet]
  )

  const getWalletIcon = () => {
    if (isInAppWallet) return <IconLogoCircle />
    if (chain === Chain.Eth) return <IconLogoCircleETH />
    return <IconLogoCircleSOL />
  }

  const formatAddress = (addr: string) => {
    if (addr.length <= 8) return addr
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <Flex
      alignItems='center'
      gap='m'
      w='100%'
      css={{ opacity: isRemovingWallet ? 0.5 : 1 }}
      justifyContent='space-between'
    >
      <Flex alignItems='center' gap='s'>
        {getWalletIcon()}
        <Text variant='body' size='m' strength='strong'>
          {messages.linkedWallet(index)}
        </Text>
        <Text variant='body' size='m' strength='strong' color='subdued'>
          {formatAddress(address)}
        </Text>
      </Flex>
      <PopupMenu
        items={items}
        aria-disabled={isRemovingWallet}
        renderTrigger={(ref, trigger) => (
          <IconButton
            ref={ref}
            icon={IconKebabHorizontal}
            size='s'
            color='subdued'
            disabled={isRemovingWallet}
            onClick={() => trigger()}
            aria-label={messages.options}
          />
        )}
      />
    </Flex>
  )
}

export const LinkedWallets = () => {
  const { spacing } = useTheme()
  const { data: connectedWallets, isLoading } = useConnectedWallets()
  const { toast } = useContext(ToastContext)
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const hasWallets = (connectedWallets?.length ?? 0) > 0
  const walletCount = connectedWallets?.length ?? 0

  const handleAddWalletSuccess = useCallback(async () => {
    toast(messages.newWalletConnected)
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.connectedWallets, currentUserId]
    })
  }, [toast, queryClient, currentUserId])

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

  const isAtLimit = walletCount >= WALLET_COUNT_LIMIT

  return (
    <Paper
      column
      alignItems='flex-start'
      backgroundColor='white'
      borderRadius='m'
    >
      <Flex column pv='l' ph='l' w='100%'>
        <Flex alignItems='center' justifyContent='space-between' w='100%'>
          <Flex alignItems='center' gap='s'>
            <Text variant='heading' size='m' color='heading'>
              {hasWallets ? messages.titleHasWallets : messages.titleNoWallets}
            </Text>
            {hasWallets && !isLoading ? (
              <Text variant='heading' size='m' color='subdued'>
                {messages.count(walletCount)}
              </Text>
            ) : null}
          </Flex>
          {hasWallets && !isLoading ? (
            <Button
              variant='secondary'
              size='small'
              onClick={openAppKitModal}
              isLoading={isConnectingWallets}
              disabled={isConnectingWallets || isAtLimit}
            >
              {messages.addWallet}
            </Button>
          ) : null}
        </Flex>
      </Flex>
      <Divider css={{ width: '100%' }} />

      {isLoading ? (
        <Flex column alignItems='center' gap='l' w='100%' pv='m' ph='xl' pb='l'>
          <Skeleton w='100%' h={spacing.unit8} />
          <Skeleton w='100%' h={spacing.unit8} />
          <Skeleton w='100%' h={spacing.unit8} />
        </Flex>
      ) : hasWallets ? (
        <Flex column gap='xl' w='100%' pv='l' ph='l'>
          {connectedWallets?.map((wallet, index) => (
            <WalletRow
              key={wallet.address}
              address={wallet.address}
              chain={wallet.chain}
              index={index}
            />
          ))}
        </Flex>
      ) : (
        <Flex column pv='m' ph='l' w='100%' gap='l'>
          <Text variant='body' size='m' color='subdued'>
            {messages.linkWallet}
          </Text>
          <Button
            fullWidth
            variant='secondary'
            size='small'
            onClick={openAppKitModal}
          >
            {messages.addWallet}
          </Button>
        </Flex>
      )}
    </Paper>
  )
}
