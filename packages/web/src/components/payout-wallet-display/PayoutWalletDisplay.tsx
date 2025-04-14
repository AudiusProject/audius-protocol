import { SolanaWalletAddress } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Flex,
  IconLogoCircle,
  IconLogoCircleUSDC,
  Text,
  Skeleton
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { getAssociatedTokenAccountOwner } from 'services/solana/solana'

const { getAccountUser } = accountSelectors

const messages = {
  builtInWallet: 'Built-In Wallet'
}

const PayoutWalletDisplayLoading = () => {
  return (
    <Flex
      alignItems='center'
      backgroundColor='surface1'
      border='default'
      borderRadius='circle'
      pt='xs'
      pl='xs'
      pr='s'
      gap='xs'
      css={{ minWidth: 140 }} // Approx width to prevent layout shift
    >
      <Skeleton h={24} w={24} css={{ borderRadius: '50%' }} />
      <Skeleton h={16} w={90} />
    </Flex>
  )
}

export const PayoutWalletDisplay = () => {
  const user = useSelector(getAccountUser)
  const payoutWallet = user?.spl_usdc_payout_wallet

  const {
    value: externalWalletOwner,
    loading: isLoadingOwner,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error
  } = useAsync(async () => {
    if (payoutWallet) {
      try {
        const owner = await getAssociatedTokenAccountOwner(
          payoutWallet as SolanaWalletAddress
        )
        // If owner is null, it might mean the ATA doesn't exist or is invalid,
        // but we still want to display the configured address to avoid confusion.
        // A null owner likely indicates an issue the user needs to resolve in the modal.
        // We'll display the payoutWallet address itself if owner lookup fails.
        return owner?.toString() ?? payoutWallet
      } catch (e) {
        console.error('Failed to get associated token account owner:', e)
        // Fallback to displaying the stored address on error
        return payoutWallet
      }
    }
    return null
  }, [payoutWallet])

  if (isLoadingOwner) {
    return <PayoutWalletDisplayLoading />
  }

  const displayAddress = externalWalletOwner ?? payoutWallet

  const isExternalWallet = !!payoutWallet

  const IconComponent = isExternalWallet ? IconLogoCircleUSDC : IconLogoCircle
  const displayText = isExternalWallet
    ? shortenSPLAddress(displayAddress ?? '') // shorten the owner address or the stored address
    : messages.builtInWallet

  return (
    <Flex
      alignItems='center'
      backgroundColor='surface1'
      border='default'
      borderRadius='circle'
      pt='xs'
      pl='xs'
      pr='s'
      gap='xs'
    >
      <IconComponent size='l' />
      <Text variant='body' size='m' strength='strong' ellipses>
        {displayText}
      </Text>
    </Flex>
  )
}
