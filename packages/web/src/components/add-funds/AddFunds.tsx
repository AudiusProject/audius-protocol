import { useState } from 'react'

import { useUSDCBalance, useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import { BuyUSDCStage, buyUSDCSelectors } from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import { Box, Button, Flex, Text, IconLogoCircleUSDC } from '@audius/harmony'
import { BN } from 'bn.js'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { PaymentMethod } from 'components/payment-method/PaymentMethod'
import { useIsMobile } from 'hooks/useIsMobile'
import { track } from 'services/analytics'

import styles from './AddFunds.module.css'

const { getBuyUSDCFlowStage } = buyUSDCSelectors

const messages = {
  usdcBalance: 'USDC Balance',
  purchasing: 'Purchasing',
  continue: 'Continue'
}

export const AddFunds = ({
  onContinue
}: {
  onContinue: (
    purchaseMethod: PurchaseMethod,
    purchaseVendor?: PurchaseVendor
  ) => void
}) => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    mint: 'USDC'
  })
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] =
    useState<PurchaseMethod>(PurchaseMethod.CARD)
  const [selectedPurchaseVendor, setSelectedPurchaseVendor] = useState<
    PurchaseVendor | undefined
  >(undefined)

  const isMobile = useIsMobile()
  const { data: balanceBN } = useUSDCBalance({
    isPolling: true,
    commitment: 'confirmed'
  })
  const balance = USDC(balanceBN ?? new BN(0)).value

  const buyUSDCStage = useSelector(getBuyUSDCFlowStage)
  const inProgress = [
    BuyUSDCStage.PURCHASING,
    BuyUSDCStage.CONFIRMING_PURCHASE
  ].includes(buyUSDCStage)

  return (
    <div className={styles.root}>
      <div
        className={cn(styles.buttonContainer, {
          [styles.mobile]: isMobile
        })}
      >
        <Flex direction='column' w='100%' gap='xl' p='xl'>
          <Box border='strong' p='m' borderRadius='s'>
            <Flex alignItems='center' justifyContent='space-between'>
              <Flex alignItems='center'>
                <IconLogoCircleUSDC />
                <Box pl='s'>
                  <Text variant='title' size='m'>
                    {messages.usdcBalance}
                  </Text>
                </Box>
              </Flex>
              <Text variant='title' size='l' strength='strong'>
                {USDC(balance).toLocaleString()}
              </Text>
            </Flex>
          </Box>
          <PaymentMethod
            showVendorChoice
            selectedVendor={selectedPurchaseVendor ?? null}
            selectedMethod={selectedPurchaseMethod}
            setSelectedMethod={setSelectedPurchaseMethod}
            setSelectedVendor={setSelectedPurchaseVendor}
          />
          <Button
            variant='primary'
            fullWidth
            onClick={() =>
              onContinue(selectedPurchaseMethod, selectedPurchaseVendor)
            }
            isLoading={inProgress}
            disabled={inProgress}
          >
            {inProgress ? messages.purchasing : messages.continue}
          </Button>
        </Flex>
      </div>
    </div>
  )
}
