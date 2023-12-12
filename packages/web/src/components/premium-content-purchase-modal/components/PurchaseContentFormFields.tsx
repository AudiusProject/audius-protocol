import { useCallback } from 'react'

import {
  PurchaseContentStage,
  usePayExtraPresets,
  useUSDCBalance,
  PURCHASE_METHOD,
  PurchaseVendor,
  PURCHASE_VENDOR,
  usePurchaseMethod,
  PurchaseMethod
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { IconCheck } from '@audius/stems'
import { useField } from 'formik'

import { Icon } from 'components/Icon'
import { PaymentMethod } from 'components/payment-method/PaymentMethod'
import { Text } from 'components/typography'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'
import { usePurchaseSummaryValues } from '../hooks/usePurchaseSummaryValues'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentFormFields.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!'
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
  const payExtraAmountPresetValues = usePayExtraPresets()
  const [{ value: purchaseMethod }, , { setValue: setPurchaseMethod }] =
    useField(PURCHASE_METHOD)
  const [, , { setValue: setPurchaseVendor }] = useField(PURCHASE_VENDOR)
  const isPurchased = stage === PurchaseContentStage.FINISH

  const { data: balanceBN } = useUSDCBalance({ isPolling: true })
  const { extraAmount } = usePurchaseSummaryValues({
    price,
    currentBalance: balanceBN
  })
  const { isExistingBalanceDisabled, totalPriceInCents } = usePurchaseMethod({
    price,
    extraAmount,
    method: purchaseMethod,
    setMethod: setPurchaseMethod
  })

  const handleChangeMethod = useCallback(
    (method: string) => {
      setPurchaseMethod(method as PurchaseMethod)
    },
    [setPurchaseMethod]
  )

  const handleChangeVendor = useCallback(
    (vendor: string) => {
      setPurchaseVendor(vendor as PurchaseVendor)
    },
    [setPurchaseVendor]
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

  return (
    <>
      {isUnlocking || isPurchased ? null : (
        <PayExtraFormSection
          amountPresets={payExtraAmountPresetValues}
          disabled={isUnlocking}
        />
      )}
      <PurchaseSummaryTable
        {...purchaseSummaryValues}
        totalPriceInCents={totalPriceInCents}
      />
      {isUnlocking || isPurchased ? null : (
        <PaymentMethod
          selectedMethod={purchaseMethod}
          setSelectedMethod={handleChangeMethod}
          setSelectedVendor={handleChangeVendor}
          balance={balanceBN}
          isExistingBalanceDisabled={isExistingBalanceDisabled}
          showExistingBalance={!balanceBN?.isZero()}
        />
      )}
      {isUnlocking ? null : <PayToUnlockInfo />}
    </>
  )
}
