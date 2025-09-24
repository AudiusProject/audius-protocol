import { useCallback, useMemo, useState } from 'react'

import {
  useConnectedWallets,
  useRemoveConnectedWallet,
  QUERY_KEYS,
  useCurrentUserId
} from '@audius/common/api'
import { Chain } from '@audius/common/models'
import Clipboard from '@react-native-clipboard/clipboard'
import { useQueryClient } from '@tanstack/react-query'

import {
  Button,
  Flex,
  IconButton,
  IconKebabHorizontal,
  IconLogoCircleETH,
  IconLogoCircleSOL,
  Paper,
  Text,
  Skeleton,
  Divider,
  useTheme
} from '@audius/harmony-native'
import ActionDrawer, {
  type ActionDrawerRow
} from 'app/components/action-drawer/ActionDrawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { useToast } from 'app/hooks/useToast'

const WALLET_COUNT_LIMIT = 5

const messages = {
  titleHasWallets: 'Linked Wallets ',
  titleNoWallets: 'Link External Wallet',
  count: (count: number) => `(${count}/${WALLET_COUNT_LIMIT})`,
  addWallet: 'Add Linked Wallet',
  copied: 'Copied To Clipboard!',
  copy: 'Copy Address',
  remove: 'Remove',
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
  index: number
}

const WalletRow = ({ address, chain, index }: WalletRowProps) => {
  const { onOpen } = useDrawer('WalletRowOverflowMenu')
  const { toast } = useToast()
  const [isRemovingWallet, setIsRemovingWallet] = useState(false)
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const copyAddressToClipboard = useCallback(() => {
    Clipboard.setString(address)
    toast({ content: messages.copied, type: 'info' })
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
      toast({ content: messages.toasts.walletRemoved, type: 'info' })
    } catch (e) {
      toast({ content: messages.toasts.error, type: 'error' })
    } finally {
      setIsRemovingWallet(false)
    }
  }, [removeConnectedWalletAsync, address, queryClient, toast, currentUserId])

  const handleOpenOverflowMenu = useCallback(() => {
    onOpen({
      address,
      copyCallback: copyAddressToClipboard,
      removeCallback: handleRemove
    })
  }, [address, copyAddressToClipboard, handleRemove, onOpen])

  const getWalletIcon = () => {
    if (chain === Chain.Eth) return <IconLogoCircleETH />
    return <IconLogoCircleSOL />
  }

  const formatAddress = (addr: string) => {
    if (addr.length <= 8) return addr
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <Flex
      row
      alignItems='center'
      gap='m'
      w='100%'
      ph='l'
      pv='m'
      style={{ opacity: isRemovingWallet ? 0.5 : 1 }}
    >
      <Flex row alignItems='center' gap='s'>
        {getWalletIcon()}
        <Text variant='body' size='m' strength='strong'>
          {messages.linkedWallet(index)}
        </Text>
      </Flex>
      <Flex flex={1}>
        <Text variant='body' size='m' strength='strong' color='subdued'>
          {formatAddress(address)}
        </Text>
      </Flex>
      <IconButton
        icon={IconKebabHorizontal}
        onPress={handleOpenOverflowMenu}
        disabled={isRemovingWallet}
        ripple
      />
    </Flex>
  )
}

export const WalletRowOverflowMenu = () => {
  const { data: drawerData } = useDrawer('WalletRowOverflowMenu')

  const rows: ActionDrawerRow[] = useMemo(
    () => [
      {
        text: messages.copy,
        callback: drawerData?.copyCallback
      },
      {
        text: messages.remove,
        callback: drawerData?.removeCallback,
        isDestructive: true
      }
    ],
    [drawerData]
  )

  return <ActionDrawer drawerName='WalletRowOverflowMenu' rows={rows} />
}

export const LinkedWallets = () => {
  const { spacing } = useTheme()
  const navigation = useNavigation()
  const { data: connectedWallets, isLoading } = useConnectedWallets()

  const hasWallets = (connectedWallets?.length ?? 0) > 0
  const walletCount = connectedWallets?.length ?? 0

  const handleAddWallet = useCallback(() => {
    navigation.navigate('ExternalWallets')
  }, [navigation])

  const isAtLimit = walletCount >= WALLET_COUNT_LIMIT

  return (
    <Paper>
      {/* Header Section */}
      <Flex gap='xl' p='l'>
        <Flex row alignItems='center' gap='s'>
          <Text variant='heading' size='m' color='heading'>
            {hasWallets ? messages.titleHasWallets : messages.titleNoWallets}
          </Text>
          {hasWallets && !isLoading ? (
            <Text variant='heading' size='m' color='subdued'>
              {messages.count(walletCount)}
            </Text>
          ) : null}
        </Flex>
      </Flex>
      <Divider />

      {/* Wallet Stack Section */}
      {isLoading ? (
        <>
          <Flex mh='l' mt='l' gap='s' h={spacing.unit16}>
            <Skeleton h={spacing.unit12} />
          </Flex>
          <Flex mh='l' gap='s' h={spacing.unit16}>
            <Skeleton h={spacing.unit12} />
          </Flex>
        </>
      ) : hasWallets ? (
        <>
          {connectedWallets?.map((wallet, index) => (
            <WalletRow
              key={wallet.address}
              address={wallet.address}
              chain={wallet.chain}
              index={index}
            />
          ))}
        </>
      ) : (
        <Flex p='l'>
          <Text variant='body' size='m' color='subdued'>
            {messages.linkWallet}
          </Text>
        </Flex>
      )}
      <Divider />

      {/* Footer Section with Add Button */}
      <Flex p='l'>
        <Button
          variant='secondary'
          size='small'
          onPress={handleAddWallet}
          disabled={isAtLimit}
          fullWidth
        >
          {messages.addWallet}
        </Button>
      </Flex>
    </Paper>
  )
}
