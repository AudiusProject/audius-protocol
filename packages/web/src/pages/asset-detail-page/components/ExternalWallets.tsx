import { useCallback, useContext, useMemo, useState } from 'react'

import {
  useRemoveConnectedWallet,
  QUERY_KEYS,
  useCurrentUserId
} from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { Chain } from '@audius/common/models'
import { useUserCoin } from '@audius/common/src/api/tan-query/coins/useUserCoin'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconCopy,
  IconLogoCircleSOL,
  IconTrash,
  IconButton,
  IconKebabHorizontal,
  Paper,
  PopupMenu,
  PopupMenuItem,
  Text,
  Box,
  Skeleton,
  Divider,
  IconLogoCircle
} from '@audius/harmony'
import { UserCoinAccount } from '@audius/sdk'
import { useQueryClient } from '@tanstack/react-query'

import { ToastContext } from 'components/toast/ToastContext'
import { copyToClipboard } from 'utils/clipboardUtil'

import {
  AlreadyAssociatedError,
  useConnectAndAssociateWallets
} from '../../../hooks/useConnectAndAssociateWallets'

const COPIED_TOAST_TIMEOUT = 2000

const messages = coinDetailsMessages.externalWallets

type WalletRowProps = {
  mint: string
  decimals: number
} & UserCoinAccount

const WalletRow = ({
  owner,
  account,
  balance,
  isInAppWallet,
  decimals
}: WalletRowProps) => {
  const { toast } = useContext(ToastContext)
  const [isRemovingWallet, setIsRemovingWallet] = useState(false)
  // For connected wallets we want to use the root wallet address, for in-app wallets the owner will be us and not the user so we need to use the token account address
  const address = isInAppWallet ? account : owner
  const copyAddressToClipboard = useCallback(() => {
    copyToClipboard(address)
    toast(messages.copied, COPIED_TOAST_TIMEOUT)
  }, [address, toast])

  const { mutateAsync: removeConnectedWalletAsync } = useRemoveConnectedWallet()

  const handleRemove = useCallback(async () => {
    setIsRemovingWallet(true)
    await removeConnectedWalletAsync({
      wallet: { address, chain: Chain.Sol },
      toast: (message) => toast(message)
    })
    setIsRemovingWallet(false)
  }, [removeConnectedWalletAsync, address, toast])

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

  return (
    <Flex
      direction='row'
      alignItems='center'
      gap='m'
      w='100%'
      css={{ opacity: isRemovingWallet ? 0.5 : 1 }}
    >
      <Flex alignItems='center' gap='s'>
        {isInAppWallet ? <IconLogoCircle /> : <IconLogoCircleSOL />}
        <Text variant='body' size='m' strength='strong'>
          {isInAppWallet ? messages.builtIn : shortenSPLAddress(address)}
        </Text>
      </Flex>
      <Flex css={{ flex: 1 }} justifyContent='flex-end'>
        <Text variant='body' size='m' strength='strong' color='default'>
          {Math.trunc(balance / Math.pow(10, decimals)).toLocaleString()}
        </Text>
      </Flex>
      <Flex
        css={{
          marginLeft: 'auto',
          flexBasis: 0
        }}
      >
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
    </Flex>
  )
}

type ExternalWalletsProps = {
  mint: string
}

export const ExternalWallets = ({ mint }: ExternalWalletsProps) => {
  const { data: userCoins, isLoading } = useUserCoin({
    mint
  })
  const { accounts: unsortedAccounts = [], decimals } = userCoins ?? {}
  const accounts = useMemo(
    () => [...unsortedAccounts].sort((a, b) => b.balance - a.balance),
    [unsortedAccounts]
  )
  const { toast } = useContext(ToastContext)
  const queryClient = useQueryClient()
  const hasAccounts = accounts.length > 0
  const { data: currentUserId } = useCurrentUserId()

  const handleAddWalletSuccess = useCallback(async () => {
    toast(messages.newWalletConnected)
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.userCoin, currentUserId]
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

  // app kit modal
  const { openAppKitModal, isPending: isConnectingWallets } =
    useConnectAndAssociateWallets(handleAddWalletSuccess, handleAddWalletError)

  return (
    <Paper
      direction='column'
      alignItems='flex-start'
      backgroundColor='white'
      borderRadius='m'
      border='default'
    >
      <Flex direction='column' pv='l' ph='l'>
        <Text variant='heading' size='s' color='heading'>
          {hasAccounts ? messages.hasBalanceTitle : messages.noBalanceTitle}
        </Text>
      </Flex>
      <Divider css={{ width: '100%' }} />
      {!hasAccounts && !isLoading && (
        <Flex direction='column' pv='m' ph='l'>
          <Text variant='body' size='m' color='subdued'>
            {messages.description}
          </Text>
        </Flex>
      )}

      {hasAccounts ? (
        <Flex direction='column' gap='xl' w='100%' pv='l' ph='l'>
          {accounts?.map((walletAccount) => (
            <WalletRow
              key={walletAccount.owner}
              {...walletAccount}
              mint={mint}
              decimals={decimals ?? 0}
            />
          ))}
        </Flex>
      ) : isLoading ? (
        <Flex
          direction='column'
          alignItems='center'
          gap='s'
          w='100%'
          pv='m'
          ph='xl'
          pb='l'
        >
          <Skeleton w='100%' h='24px' />
        </Flex>
      ) : null}

      <Divider css={{ width: '100%' }} />
      <Box pv='l' ph='l' w='100%'>
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
