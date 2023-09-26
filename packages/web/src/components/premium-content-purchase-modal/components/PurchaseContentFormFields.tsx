import {
  PurchaseContentStage,
  UserTrackMetadata,
  purchaseContentSelectors
} from '@audius/common'
import { IconCheck } from '@audius/stems'
import { useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import { usePurchaseSummaryValues } from '../hooks'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentFormFields.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'
import { payExtraAmountPresetValues } from './constants'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!'
}

const { getPurchaseContentFlowStage } = purchaseContentSelectors

export const PurchaseContentFormFields = ({
  track
}: {
  track: Pick<UserTrackMetadata, 'premium_conditions'>
}) => {
  const stage = useSelector(getPurchaseContentFlowStage)
  const isPurchased = stage === PurchaseContentStage.FINISH
  const purchaseSummaryValues = usePurchaseSummaryValues(track)
  if (!purchaseSummaryValues) {
    return null
  }
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
