import { useCallback, useContext } from 'react'

import { accountSelectors } from '@audius/common/store'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Flex,
  IconLogoCircle,
  IconLogoCircleUSDC,
  LoadingSpinner,
  Paper,
  Text,
  TextLink
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { useModalState } from 'common/hooks/useModalState'
import { ToastContext } from 'components/toast/ToastContext'
import { getAssociatedTokenAccountOwner } from 'services/solana/solana'

const { getAccountSplWallet } = accountSelectors

const messages = {
  payoutWallet: 'Payout Wallet',
  details: 'For USDC earned from sales on Audius',
  audiusWallet: 'Audius (Default)',
  change: 'Change'
}

export const PayoutWalletCard = () => {
  const accountSplWallet = useSelector(getAccountSplWallet)
  const [, setIsOpen] = useModalState('PayoutWallet')
  const { toast } = useContext(ToastContext)

  const handleChangeWallet = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const { value: payoutWallet } = useAsync(async () => {
    if (accountSplWallet) {
      try {
        const owner = await getAssociatedTokenAccountOwner(accountSplWallet)
        return owner.toBase58()
      } catch (e) {
        toast('Failed to load USDC payout wallet')
        return null
      }
    }
    return null
  }, [accountSplWallet])

  return (
    <Paper direction='column' shadow='far' borderRadius='l' pv='l' ph='xl'>
      <Flex justifyContent='space-between' wrap='wrap' gap='l'>
        <Flex direction='column' alignItems='flex-start' gap='m'>
          <Text variant='title' size='l' color='default'>
            {messages.payoutWallet}
          </Text>
          <Text variant='body' size='m' color='default' textAlign='left'>
            {messages.details}
          </Text>
        </Flex>
        <Flex alignItems='center' justifyContent='space-between' gap='xl'>
          <Flex
            backgroundColor='surface2'
            gap='s'
            border='strong'
            borderRadius='xs'
            p='s'
            wrap='wrap'
            justifyContent='center'
            alignItems='center'
          >
            {accountSplWallet ? (
              <IconLogoCircleUSDC />
            ) : (
              <IconLogoCircle size='m' />
            )}
            <Text variant='body' size='m' strength='strong'>
              {accountSplWallet ? (
                payoutWallet ? (
                  shortenSPLAddress(payoutWallet)
                ) : (
                  <Flex w='xl'>
                    <LoadingSpinner />
                  </Flex>
                )
              ) : (
                messages.audiusWallet
              )}
            </Text>
          </Flex>
          <TextLink
            onClick={handleChangeWallet}
            variant='visible'
            textVariant='body'
            size='m'
            strength='strong'
          >
            {messages.change}
          </TextLink>
        </Flex>
      </Flex>
    </Paper>
  )
}
