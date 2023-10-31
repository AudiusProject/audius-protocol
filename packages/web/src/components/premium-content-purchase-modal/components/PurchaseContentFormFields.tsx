import {
  PurchaseContentStage,
  isContentPurchaseInProgress,
  usePayExtraPresets,
  useUSDCManualTransferModal
} from '@audius/common'
import { PlainButton } from '@audius/harmony'
import { IconCheck } from '@audius/stems'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'
import { useRemoteVar } from 'hooks/useRemoteConfig'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentFormFields.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!',
  manualTransfer: '(Advanced) Manual Crypto Transfer'
}

type PurchaseContentFormFieldsProps = Pick<
  PurchaseContentFormState,
  'purchaseSummaryValues' | 'stage'
>

export const PurchaseContentFormFields = ({
  purchaseSummaryValues,
  stage
}: PurchaseContentFormFieldsProps) => {
  const { onOpen: openUsdcManualTransferModal } = useUSDCManualTransferModal()
  const payExtraAmountPresetValues = usePayExtraPresets(useRemoteVar)
  const isPurchased = stage === PurchaseContentStage.FINISH
  const isInProgress = isContentPurchaseInProgress(stage)

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
      <PayExtraFormSection
        amountPresets={payExtraAmountPresetValues}
        disabled={isInProgress}
      />
      <div className={styles.tableContainer}>
        <PurchaseSummaryTable
          {...purchaseSummaryValues}
          isPurchased={isPurchased}
        />
        <Text
          as={PlainButton}
          disabled={isInProgress}
          onClick={() => openUsdcManualTransferModal()}
          color='primary'
        >
          {messages.manualTransfer}
        </Text>
      </div>
      {isInProgress ? null : <PayToUnlockInfo />}
    </>
  )
}
