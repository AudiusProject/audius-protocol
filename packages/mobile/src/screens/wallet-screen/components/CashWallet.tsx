import React, { useCallback, useRef } from 'react'

import {
  useFormattedUSDCBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { Name } from '@audius/common/models'
import { useAddCashModal } from '@audius/common/store'
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  Box,
  Button,
  Flex,
  IconButton,
  IconInfo,
  IconLogoCircleUSDC,
  Paper,
  Skeleton,
  Text,
  useTheme
} from '@audius/harmony-native'
import { make, track } from 'app/services/analytics'

export const CashWallet = () => {
  const isManagedAccount = useIsManagedAccount()
  const { onOpen: openAddCashModal } = useAddCashModal()
  const { balanceFormatted, isLoading } = useFormattedUSDCBalance()
  const insets = useSafeAreaInsets()
  const { color } = useTheme()

  // Create a ref for the bottom sheet modal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  const handleAddCash = useCallback(() => {
    openAddCashModal()
    track(
      make({
        eventName: Name.BUY_USDC_ADD_FUNDS_MANUALLY
      })
    )
  }, [openAddCashModal])

  // Function to handle opening the bottom sheet
  const handleOpenInfoModal = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  return (
    <>
      <Paper>
        <Flex p='l' gap='s' direction='column'>
          <Flex gap='xs' direction='row' alignItems='center'>
            <Box mr='s'>
              <IconLogoCircleUSDC size='l' />
            </Box>
            <Text variant='heading' size='s' color='subdued'>
              {walletMessages.cashBalance}
            </Text>
            <IconButton
              icon={IconInfo}
              size='s'
              color='subdued'
              aria-label='Cash balance information'
              onPress={handleOpenInfoModal}
            />
          </Flex>

          {isLoading ? (
            <Skeleton h='4xl' w='5xl' />
          ) : (
            <Text variant='display' size='m' color='default'>
              {balanceFormatted}
            </Text>
          )}

          {!isManagedAccount ? (
            <Button variant='secondary' onPress={handleAddCash} fullWidth>
              {walletMessages.addCash}
            </Button>
          ) : null}
        </Flex>
      </Paper>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['25%']}
        topInset={insets.top}
        backgroundStyle={{ backgroundColor: color.background.white }}
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
            {walletMessages.cashBalance}
          </Text>
          <Box mt='m'>
            <Text variant='body' size='m'>
              {walletMessages.cashBalanceTooltip}
            </Text>
          </Box>
        </Flex>
      </BottomSheetModal>
    </>
  )
}
