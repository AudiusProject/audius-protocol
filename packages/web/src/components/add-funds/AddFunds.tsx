import { useCallback, useState } from 'react'

import {
  BNUSDC,
  PurchaseMethod,
  PurchaseVendor,
  decimalIntegerToHumanReadable,
  formatUSDCWeiToFloorCentsNumber,
  useCreateUserbankIfNeeded,
  useUSDCBalance
} from '@audius/common'
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
  onContinue: (purchaseMethod: PurchaseMethod) => void
}) => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    audiusBackendInstance,
    mint: 'usdc'
  })
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] =
    useState<PurchaseMethod>(PurchaseMethod.CARD)
  const mobile = isMobile()
  const { data: balance } = useUSDCBalance({ isPolling: true })
  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

  const vendorOptions = [{ label: PurchaseVendor.STRIPE }]

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
                console.info(vendor)
              }}
              options={vendorOptions}
              zIndex={zIndex.ADD_FUNDS_VENDOR_SELECTION_DRAWER}
            />
          ) : (
            <FilterButton
              onSelect={({ label: vendor }: { label: string }) => {
                console.info(vendor)
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
        <Flex direction='column' w='100%' gap='xl'>
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
                {`$${balanceFormatted}`}
              </Text>
            </Flex>
          </Box>
          <SummaryTable
            title={messages.paymentMethod}
            items={items}
            withRadioOptions
            onRadioChange={handleChangeOption}
            selectedRadioOption={selectedPurchaseMethod}
            rowClassName={mobile ? styles.summaryTableRow : undefined}
            rowValueClassName={mobile ? styles.summaryTableRowValue : undefined}
          />
          <Button
            variant={ButtonType.PRIMARY}
            fullWidth
            onClick={() => onContinue(selectedPurchaseMethod)}
          >
            {messages.continue}
          </Button>
        </Flex>
      </div>
    </div>
  )
}
