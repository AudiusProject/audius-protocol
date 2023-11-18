import { ChangeEvent, useCallback } from 'react'

import {
  PurchaseContentStage,
  usePayExtraPresets,
  useUSDCBalance,
  PurchaseMethod,
  PURCHASE_METHOD,
  Vendors
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
import { useRemoteVar } from 'hooks/useRemoteConfig'

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
  paymentMethod: 'Payment Method',
  dollarSign: '$'
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
  const { data: balance } = useUSDCBalance()
  const mobile = isMobile()
  const payExtraAmountPresetValues = usePayExtraPresets(useRemoteVar)
  const [{ value: purchaseMethod }, , { setValue: setPurchaseMethod }] =
    useField(PURCHASE_METHOD)
  const isPurchased = stage === PurchaseContentStage.FINISH
  const balanceUSDC = USDC((balance ?? new BN(0)) as BN).value
  const { extraAmount } = usePurchaseSummaryValues({
    price,
    currentBalance: balance
  })
  const isExistingBalanceDisabled =
    USDC(price / 100).value + USDC((extraAmount ?? 0) / 100).value > balanceUSDC
  const hasBalance = balanceUSDC > 0

  if (
    purchaseMethod === PurchaseMethod.EXISTING_BALANCE &&
    isExistingBalanceDisabled
  ) {
    setPurchaseMethod(PurchaseMethod.CARD)
  }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setPurchaseMethod(e?.target?.value)
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

  const options = [
    hasBalance
      ? {
          label: messages.existingBalance,
          id: PurchaseMethod.EXISTING_BALANCE,
          icon: IconDonate,
          disabled: isExistingBalanceDisabled,
          value: (
            <Text
              variant='title'
              color={
                purchaseMethod === PurchaseMethod.EXISTING_BALANCE
                  ? 'secondary'
                  : undefined
              }
            >
              {`$${USDC(balanceUSDC).toFixed(2)}`}
            </Text>
          )
        }
      : null,
    {
      label: messages.card,
      id: PurchaseMethod.CARD,
      icon: IconCreditCard,
      value: mobile ? (
        <MobileFilterButton
          onSelect={() => {}}
          options={[{ label: Vendors.STRIPE }]}
        />
      ) : (
        <FilterButton
          onSelect={() => {}}
          initialSelectionIndex={0}
          variant={FilterButtonType.REPLACE_LABEL}
          options={[{ label: Vendors.STRIPE }]}
        />
      )
    },
    {
      label: messages.manualTransfer,
      id: PurchaseMethod.MANUAL_TRANSFER,
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
        isPurchased={isPurchased}
      />
      <SummaryTable
        title={messages.paymentMethod}
        withRadioOptions
        onRadioChange={handleChange}
        selectedRadioOption={purchaseMethod}
        items={options}
        rowClassName={mobile ? styles.summaryTableRow : undefined}
        rowValueClassName={mobile ? styles.summaryTableRowValue : undefined}
      />
      {isUnlocking ? null : <PayToUnlockInfo />}
    </>
  )
}
