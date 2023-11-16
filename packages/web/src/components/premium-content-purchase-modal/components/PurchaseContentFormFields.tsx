import { ChangeEvent, useCallback } from 'react'

import {
  BNUSDC,
  PurchaseContentStage,
  usePayExtraPresets,
  useUSDCBalance,
  removeNullable,
  PurchaseMethod,
  PURCHASE_METHOD
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { IconCheck, RadioButtonGroup } from '@audius/stems'
import BN from 'bn.js'
import { useField } from 'formik'

import { Icon } from 'components/Icon'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { Text } from 'components/typography'
import { useRemoteVar } from 'hooks/useRemoteConfig'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentFormFields.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!',
  existingBalance: 'Existing balance',
  card: 'Add funds with card',
  manualTransfer: 'Add with crypto transfer'
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
  const payExtraAmountPresetValues = usePayExtraPresets(useRemoteVar)
  const [{ value: purchaseMethod }, , { setValue: setPurchaseMethod }] =
    useField(PURCHASE_METHOD)
  const isPurchased = stage === PurchaseContentStage.FINISH

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
    { label: messages.existingBalance, value: PurchaseMethod.EXISTING_BALANCE },
    { label: messages.card, value: PurchaseMethod.CARD },
    balance?.gte(new BN(price) as BNUSDC)
      ? {
          label: messages.manualTransfer,
          value: PurchaseMethod.MANUAL_TRANSFER
        }
      : null
  ].filter(removeNullable)

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
      <RadioButtonGroup
        name={'purchaseMethod'}
        value={purchaseMethod}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <ModalRadioItem
            key={opt.label}
            label={opt.label}
            description={null}
            value={opt.value}
          />
        ))}
      </RadioButtonGroup>
      {isUnlocking ? null : <PayToUnlockInfo />}
    </>
  )
}
