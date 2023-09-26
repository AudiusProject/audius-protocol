import {
  BNUSDC,
  Nullable,
  PurchaseContentFormState,
  PurchaseContentStage,
  payExtraAmountPresetValues,
  usePurchaseSummaryValues
} from '@audius/common'
import { IconCheck } from '@audius/stems'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentFormFields.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!'
}

export const PurchaseContentFormFields = ({
  purchaseSummaryValues,
  stage
}: PurchaseContentFormState) => {
  const isPurchased = stage === PurchaseContentStage.FINISH

  if (isPurchased) {
    return (
      <>
        <PurchaseSummaryTable
          {...purchaseSummaryValues}
          isPurchased={isPurchased}
        />
        <div className={styles.purchaseSuccessfulContainer}>
          <div className={styles.completionCheck}>
            <Icon icon={IconCheck} size='xxSmall' color='white' />
          </div>
          <Text variant='heading' size='small'>
            {messages.purchaseSuccessful}
          </Text>
        </div>
      </>
    )
  }
  return (
    <>
      <PayExtraFormSection amountPresets={payExtraAmountPresetValues} />
      <PurchaseSummaryTable
        {...purchaseSummaryValues}
        isPurchased={isPurchased}
      />
      <PayToUnlockInfo />
    </>
  )
}
