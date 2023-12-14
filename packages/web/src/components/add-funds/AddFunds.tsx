import { useState } from 'react'

import {
  PurchaseMethod,
  PurchaseVendor,
  useCreateUserbankIfNeeded,
  useUSDCBalance,
  PayExtraPreset,
  CUSTOM_AMOUNT
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import {
  Box,
  Button,
  ButtonType,
  Flex,
  Text,
  IconLogoCircleUSDC
} from '@audius/harmony'
import { BN } from 'bn.js'
import cn from 'classnames'
import { useField } from 'formik'

import { AMOUNT_PRESET } from 'components/add-funds-modal/constants'
import { PaymentMethod } from 'components/payment-method/PaymentMethod'
import { track } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { isMobile } from 'utils/clientUtil'

import styles from './AddFunds.module.css'

const messages = {
  usdcBalance: 'USDC Balance',
  continue: 'Continue'
}

export const AddFunds = ({
  onContinue
}: {
  onContinue: ({
    purchaseMethod,
    purchaseVendor,
    amountPreset,
    customAmount
  }: {
    purchaseMethod: PurchaseMethod
    purchaseVendor?: PurchaseVendor
    amountPreset?: PayExtraPreset
    customAmount?: number
  }) => void
}) => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    audiusBackendInstance,
    mint: 'usdc'
  })
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] =
    useState<PurchaseMethod>(PurchaseMethod.CARD)
  const [selectedPurchaseVendor, setSelectedPurchaseVendor] = useState<
    PurchaseVendor | undefined
  >(undefined)
  const [{ value: amountPreset }, ,] = useField(AMOUNT_PRESET)
  const [{ value: customAmount }, ,] = useField<number>(CUSTOM_AMOUNT)

  const mobile = isMobile()
  const { data: balanceBN } = useUSDCBalance({ isPolling: true })
  const balance = USDC(balanceBN ?? new BN(0)).value

  return (
    <div className={styles.root}>
      <div
        className={cn(styles.buttonContainer, {
          [styles.mobile]: mobile
        })}
      >
        <Flex direction='column' w='100%' gap='xl' p='xl'>
          <Box h='unit6' border='strong' p='m' borderRadius='s'>
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
                {`$${USDC(balance).toLocaleString('en-us', {
                  roundingMode: 'floor',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
              </Text>
            </Flex>
          </Box>
          <PaymentMethod
            selectedMethod={selectedPurchaseMethod}
            selectedVendor={selectedPurchaseVendor}
            setSelectedMethod={setSelectedPurchaseMethod}
            setSelectedVendor={setSelectedPurchaseVendor}
            showCoinflowAmounts={true}
          />
          <Button
            variant={ButtonType.PRIMARY}
            fullWidth
            onClick={() =>
              onContinue({
                purchaseMethod: selectedPurchaseMethod,
                purchaseVendor: selectedPurchaseVendor,
                amountPreset,
                customAmount
              })
            }
          >
            {messages.continue}
          </Button>
        </Flex>
      </div>
    </div>
  )
}
