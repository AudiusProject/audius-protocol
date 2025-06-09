import { useEffect } from 'react'

import { walletMessages } from '@audius/common/messages'
import {
  withdrawUSDCSelectors,
  useCoinflowWithdrawModal,
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  CoinflowWithdrawState
} from '@audius/common/store'
import { useField } from 'formik'
import { Image } from 'react-native'
import { useSelector } from 'react-redux'

import { Flex, LoadingSpinner, spacing, Text } from '@audius/harmony-native'
import EmojiRaisedHands from 'app/assets/images/emojis/raised-hand.png'

import type { WithdrawFormValues } from '../types'
import { AMOUNT } from '../types'

const { getCoinflowState } = withdrawUSDCSelectors

export const PrepareTransfer = () => {
  const coinflowState = useSelector(getCoinflowState)
  const { onOpen } = useCoinflowWithdrawModal()
  const { setData } = useWithdrawUSDCModal()
  const [{ value: amountCents }] =
    useField<WithdrawFormValues[typeof AMOUNT]>(AMOUNT)

  useEffect(() => {
    if (coinflowState === CoinflowWithdrawState.READY_FOR_WITHDRAWAL) {
      setData({ page: WithdrawUSDCModalPages.COINFLOW_TRANSFER })
      onOpen({ amount: amountCents / 100.0 })
    }
  }, [coinflowState, setData, onOpen, amountCents])

  return (
    <Flex gap='xl' alignItems='center' justifyContent='center' p='xl'>
      <LoadingSpinner
        style={{ height: spacing.unit10, width: spacing.unit10 }}
      />
      <Flex gap='m' alignItems='center' justifyContent='center'>
        <Flex row gap='m' alignItems='center' justifyContent='center'>
          <Image
            source={EmojiRaisedHands}
            style={{ width: spacing.unit12, height: spacing.unit12 }}
          />

          <Text variant='heading' size='xl' textAlign='center'>
            {walletMessages.holdOn}
          </Text>
        </Flex>
        <Text variant='body' textAlign='center'>
          {walletMessages.preparingTransfer}
        </Text>
      </Flex>
    </Flex>
  )
}
