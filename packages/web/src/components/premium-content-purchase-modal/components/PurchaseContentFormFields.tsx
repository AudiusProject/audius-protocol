import { useCallback } from 'react'

import {
  PurchaseContentStage,
  usePayExtraPresets,
  useUSDCBalance,
  PurchaseMethod,
  PURCHASE_METHOD,
  PurchaseVendor,
  usePurchaseMethod
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import {
  FilterButton,
  FilterButtonType,
  Flex,
  IconCreditCard,
  IconDonate,
  IconTransaction
} from '@audius/harmony'
import { IconCheck } from '@audius/stems'
import BN from 'bn.js'
import { useField } from 'formik'
import { isMobile } from 'web3modal'

import { Icon } from 'components/Icon'
import { MobileFilterButton } from 'components/mobile-filter-button/MobileFilterButton'
import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { Text } from 'components/typography'
import zIndex from 'utils/zIndex'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'
import { usePurchaseSummaryValues } from '../hooks/usePurchaseSummaryValues'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentFormFields.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!',
  existingBalance: 'Existing balance',
  card: 'Add funds with card',
  manualTransfer: 'Add with crypto transfer',
  paymentMethod: 'Payment Method'
}

type PurchaseContentFormFieldsProps = Pick<
  PurchaseContentFormState,
  'purchaseSummaryValues' | 'stage' | 'isUnlocking'
> & { price: number }

export const PurchaseContentFormFields = ({
  price,
  purchaseSummaryValues,
  stage,
  isUnlocking
}: PurchaseContentFormFieldsProps) => {
  const mobile = isMobile()
  const payExtraAmountPresetValues = usePayExtraPresets()
  const [{ value: purchaseMethod }, , { setValue: setPurchaseMethod }] =
    useField(PURCHASE_METHOD)
  const isPurchased = stage === PurchaseContentStage.FINISH

  const { data: balanceBN } = useUSDCBalance()
  const balance = USDC(balanceBN ?? new BN(0)).value
  const { extraAmount } = usePurchaseSummaryValues({
    price,
    currentBalance: balanceBN
  })
  const hasBalance = balance > 0
  const { isExistingBalanceDisabled, totalPriceInCents } = usePurchaseMethod({
    price,
    extraAmount,
    method: purchaseMethod,
    setMethod: setPurchaseMethod
  })

  const handleChange = useCallback(
    (method: string) => {
      setPurchaseMethod(method as PurchaseMethod)
    },
    [setPurchaseMethod]
  )

  if (isPurchased) {
    return (
      <Flex alignItems='center' justifyContent='center' gap='m' p='m'>
        <div className={styles.completionCheck}>
          <Icon icon={IconCheck} size='xxSmall' color='white' />
        </div>
        <Text variant='heading' size='small'>
          {messages.purchaseSuccessful}
        </Text>
      </Flex>
    )
  }

  const vendorOptions = [
    { label: PurchaseVendor.STRIPE },
    { label: PurchaseVendor.COINFLOW }
  ]

  const options = [
    hasBalance
      ? {
          id: PurchaseMethod.BALANCE,
          label: messages.existingBalance,
          icon: IconDonate,
          disabled: isExistingBalanceDisabled,
          value: (
            <Text
              as='span' // Needed to avoid <p> inside <p> warning
              variant='title'
              color={
                purchaseMethod === PurchaseMethod.BALANCE
                  ? 'secondary'
                  : undefined
              }
            >
              {`$${USDC(balance).toLocaleString('en-us', {
                roundingMode: 'floor',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
            </Text>
          )
        }
      : null,
    {
      id: PurchaseMethod.CARD,
      label: messages.card,
      icon: IconCreditCard,
      value:
        vendorOptions.length > 1 ? (
          mobile ? (
            <MobileFilterButton
              onSelect={() => {}}
              options={vendorOptions}
              zIndex={zIndex.ADD_FUNDS_VENDOR_SELECTION_DRAWER}
            />
          ) : (
            <FilterButton
              onSelect={() => {}}
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
      label: messages.manualTransfer,
      icon: IconTransaction
    }
  ].filter(Boolean) as SummaryTableItem[]

  return (
    <>
      <PayExtraFormSection
        amountPresets={payExtraAmountPresetValues}
        disabled={isUnlocking}
      />
      <PurchaseSummaryTable
        {...purchaseSummaryValues}
        totalPriceInCents={totalPriceInCents}
      />
      <SummaryTable
        title={messages.paymentMethod}
        withRadioOptions
        onRadioChange={handleChange}
        selectedRadioOption={purchaseMethod}
        items={options}
      />
      {isUnlocking ? null : <PayToUnlockInfo />}
    </>
  )
}
