import React, { useCallback, useRef } from 'react'

import { useIsManagedAccount, useUSDCBalance } from '@audius/common/hooks'
import { Name, Status } from '@audius/common/models'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Box,
  Button,
  Flex,
  IconButton,
  IconInfo,
  IconLogoCircleUSDC,
  Paper,
  Text
} from '@audius/harmony-native'
import LoadingSpinner from 'app/components/loading-spinner'
import { make, track } from 'app/services/analytics'

const messages = {
  cashBalance: 'Cash Balance',
  withdraw: 'Withdraw',
  cashBalanceTooltip:
    'Your cash balance is stored as USDC in your built-in wallet'
}

export const CashWallet = () => {
  const isManagedAccount = useIsManagedAccount()
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { data: balance, status: balanceStatus } = useUSDCBalance()
  const insets = useSafeAreaInsets()

  // Create a ref for the bottom sheet modal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  // Calculate the balance in cents by flooring to 2 decimal places
  const usdcValue = USDC(balance ?? 0).floor(2)

  // Format the balance for display with exactly 2 decimal places
  const balanceFormatted = usdcValue.toFixed(2).replace('$', '')

  const handleWithdraw = useCallback(() => {
    openWithdrawUSDCModal({
      page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS
    })
    track(
      make({
        eventName: Name.WITHDRAW_USDC_MODAL_OPENED,
        currentBalance: Number(usdcValue.toString())
      })
    )
  }, [openWithdrawUSDCModal, usdcValue])

  // Function to handle opening the bottom sheet
  const handleOpenInfoModal = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  if (balanceStatus === Status.LOADING) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Paper>
        <Flex p='l' gap='s' direction='column'>
          <Flex gap='xs' direction='row' alignItems='center'>
            <Box mr='s'>
              <IconLogoCircleUSDC size='l' />
            </Box>
            <Text variant='heading' size='s' color='subdued'>
              {messages.cashBalance}
            </Text>
            <IconButton
              icon={IconInfo}
              size='s'
              color='subdued'
              aria-label='Cash balance information'
              onPress={handleOpenInfoModal}
            />
          </Flex>

          <Text variant='display' size='m' color='default'>
            ${balanceFormatted}
          </Text>

          {!isManagedAccount ? (
            <Button variant='primary' onPress={handleWithdraw} fullWidth>
              {messages.withdraw}
            </Button>
          ) : null}
        </Flex>
      </Paper>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['25%']}
        topInset={insets.top}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior='close'
          />
        )}
      >
        <Flex p='l'>
          <Text variant='title' size='m'>
            Cash Balance
          </Text>
          <Box mt='m'>
            <Text variant='body' size='m'>
              {messages.cashBalanceTooltip}
            </Text>
          </Box>
        </Flex>
      </BottomSheetModal>
    </>
  )
}
