import { useCallback, useEffect } from 'react'

import {
  useFeatureFlag,
  useRemoteVar,
  useUSDCBalance,
  usePayExtraPresets,
  PURCHASE_METHOD,
  PURCHASE_VENDOR,
  usePurchaseMethod,
  PurchaseableTrackMetadata
} from '@audius/common/hooks'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import { IntKeys, FeatureFlags } from '@audius/common/services'
import { PurchaseContentStage } from '@audius/common/store'
import { Flex, IconCheck, Text } from '@audius/harmony'
import { useField } from 'formik'

import { Icon } from 'components/Icon'
import { PaymentMethod } from 'components/payment-method/PaymentMethod'

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
> & {
  price: number
  track: PurchaseableTrackMetadata
}

export const PurchaseContentFormFields = ({
  price,
  purchaseSummaryValues,
  stage,
  isUnlocking,
  track
}: PurchaseContentFormFieldsProps) => {
  const payExtraAmountPresetValues = usePayExtraPresets()
  const coinflowMaximumCents = useRemoteVar(IntKeys.COINFLOW_MAXIMUM_CENTS)
  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.BUY_WITH_COINFLOW
  )
  const [{ value: purchaseMethod }, , { setValue: setPurchaseMethod }] =
    useField(PURCHASE_METHOD)
  const [{ value: purchaseVendor }, , { setValue: setPurchaseVendor }] =
    useField(PURCHASE_VENDOR)
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

  const showCoinflow =
    isCoinflowEnabled && totalPriceInCents <= coinflowMaximumCents

  useEffect(() => {
    if (purchaseVendor === PurchaseVendor.COINFLOW && !showCoinflow) {
      handleChangeVendor(PurchaseVendor.STRIPE)
    }
  }, [handleChangeVendor, showCoinflow, purchaseVendor])

  if (isPurchased) {
    return (
      <Flex alignItems='center' justifyContent='center' gap='m' p='m'>
        <div className={styles.completionCheck}>
          <Icon icon={IconCheck} size='xxSmall' color='white' />
        </div>
        <Text variant='heading' size='s'>
          {messages.purchaseSuccessful}
        </Text>
      </Flex>
    )
  }

  const stemsPurchaseCount = track.is_download_gated
    ? track._stems?.length ?? 0
    : 0
  const downloadPurchaseCount =
    track.is_download_gated && track.download?.is_downloadable ? 1 : 0
  const streamPurchaseCount = track.is_stream_gated ? 1 : 0

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
        stemsPurchaseCount={stemsPurchaseCount}
        downloadPurchaseCount={downloadPurchaseCount}
        streamPurchaseCount={streamPurchaseCount}
        totalPriceInCents={totalPriceInCents}
      />
      {isUnlocking || isPurchased ? null : (
        <PaymentMethod
          selectedMethod={purchaseMethod}
          setSelectedMethod={handleChangeMethod}
          selectedVendor={purchaseVendor}
          setSelectedVendor={handleChangeVendor}
          balance={balanceBN}
          isExistingBalanceDisabled={isExistingBalanceDisabled}
          showExistingBalance={!!(balanceBN && !balanceBN.isZero())}
          isCoinflowEnabled={showCoinflow}
        />
      )}
      {isUnlocking ? null : <PayToUnlockInfo />}
    </>
  )
}
