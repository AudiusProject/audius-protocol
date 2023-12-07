import { useCallback, useState } from 'react'

import {
  FeatureFlags,
  PurchaseMethod,
  PurchaseVendor,
  useCreateUserbankIfNeeded,
  useFeatureFlag,
  useUSDCBalance
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import {
  Box,
  Button,
  ButtonType,
  Flex,
  Text,
  IconLogoCircleUSDC,
  IconCreditCard,
  IconTransaction,
  FilterButton,
  FilterButtonType
} from '@audius/harmony'
import { BN } from 'bn.js'
import cn from 'classnames'

import { MobileFilterButton } from 'components/mobile-filter-button/MobileFilterButton'
import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { track } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { isMobile } from 'utils/clientUtil'
import { zIndex } from 'utils/zIndex'

import styles from './AddFunds.module.css'

const messages = {
  usdcBalance: 'USDC Balance',
  paymentMethod: 'Payment Method',
  withCard: 'Add funds with Card',
  withCrypto: 'Add funds with crypto transfer',
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
  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.BUY_WITH_COINFLOW
  )

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

  const mobile = isMobile()
  const { data: balanceBN } = useUSDCBalance({ isPolling: true })
  const balance = USDC(balanceBN ?? new BN(0)).value

  const vendorOptions = [
    ...(isCoinflowEnabled ? [{ label: PurchaseVendor.COINFLOW }] : []),
    { label: PurchaseVendor.STRIPE }
  ]

  const items: SummaryTableItem[] = [
    {
      id: PurchaseMethod.CARD,
      label: messages.withCard,
      icon: IconCreditCard,
      value:
        vendorOptions.length > 1 ? (
          mobile ? (
            <MobileFilterButton
              onSelect={(vendor: string) => {
                setSelectedPurchaseVendor(vendor as PurchaseVendor)
              }}
              options={vendorOptions}
              zIndex={zIndex.ADD_FUNDS_VENDOR_SELECTION_DRAWER}
            />
          ) : (
            <FilterButton
              onSelect={(vendor: string) => {
                setSelectedPurchaseVendor(vendor as PurchaseVendor)
              }}
              initialSelectionIndex={0}
              variant={FilterButtonType.REPLACE_LABEL}
              options={vendorOptions}
              popupZIndex={zIndex.USDC_ADD_FUNDS_FILTER_BUTTON_POPUP}
            />
          )
        ) : null
    },
    {
      id: PurchaseMethod.CRYPTO,
      label: messages.withCrypto,
      icon: IconTransaction
    }
  ]

  const handleChangeOption = useCallback(
    (method: string) => {
      setSelectedPurchaseMethod(method as PurchaseMethod)
    },
    [setSelectedPurchaseMethod]
  )

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
          <SummaryTable
            title={messages.paymentMethod}
            items={items}
            withRadioOptions
            onRadioChange={handleChangeOption}
            selectedRadioOption={selectedPurchaseMethod}
          />
          <Button
            variant={ButtonType.PRIMARY}
            fullWidth
            onClick={() =>
              onContinue(selectedPurchaseMethod, selectedPurchaseVendor)
            }
          >
            {messages.continue}
          </Button>
        </Flex>
      </div>
    </div>
  )
}
