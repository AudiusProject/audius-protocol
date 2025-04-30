import { useMemo } from 'react'

import { useWalletOwner } from '@audius/common/api'
import { accountSelectors } from '@audius/common/store'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Flex,
  IconLogoCircleSOL,
  IconLogoWhiteBackground,
  Skeleton,
  Text,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'

const { getAccountUser } = accountSelectors

const messages = {
  builtInWallet: 'Built-In Wallet'
}

const PayoutWalletDisplaySkeleton = () => {
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
  const { cornerRadius } = useTheme()

  const { data: externalWalletOwner, isLoading: isLoadingOwner } =
    useWalletOwner(payoutWallet)

  const isExternalWallet = !!payoutWallet

  const iconComponent = useMemo(() => {
    if (isExternalWallet) {
      return <IconLogoCircleSOL size='l' />
    } else {
      return (
        <IconLogoWhiteBackground
          size='l'
          css={{ borderRadius: cornerRadius.circle }}
        />
      )
    }
  }, [cornerRadius.circle, isExternalWallet])

  if (isLoadingOwner) {
    return <PayoutWalletDisplaySkeleton />
  }

  const displayAddress = externalWalletOwner ?? payoutWallet

  const displayText = isExternalWallet
    ? shortenSPLAddress(displayAddress ?? '') // shorten the owner address or the stored address
    : messages.builtInWallet

  return (
    <Flex
      alignItems='center'
      backgroundColor='surface1'
      border='default'
      borderRadius='circle'
      pv='xs'
      pl='xs'
      pr='s'
      gap='xs'
    >
      {iconComponent}
      <Text variant='body' size='m' strength='strong' ellipses>
        {displayText}
      </Text>
    </Flex>
  )
}
