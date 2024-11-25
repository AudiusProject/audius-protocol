import { useCallback, useEffect } from 'react'

import {
  useFeatureFlag,
  useRemoteVar,
  useUSDCBalance,
  usePayExtraPresets,
  PURCHASE_METHOD,
  PURCHASE_VENDOR,
  usePurchaseMethod,
  PurchaseableContentMetadata,
  isPurchaseableAlbum,
  GUEST_CHECKOUT,
  PURCHASE_METHOD_MINT_ADDRESS
} from '@audius/common/hooks'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import { IntKeys, FeatureFlags } from '@audius/common/services'
import { PurchaseContentStage } from '@audius/common/store'
import { Flex, Text, IconValidationCheck, Box } from '@audius/harmony'
import { useField } from 'formik'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { PaymentMethod } from 'components/payment-method/PaymentMethod'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'
import { usePurchaseSummaryValues } from '../hooks/usePurchaseSummaryValues'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const messages = {
  purchaseSuccessful: 'Your Purchase Was Successful!'
}

type PurchaseContentFormFieldsProps = Pick<
  PurchaseContentFormState,
  'purchaseSummaryValues' | 'stage' | 'isUnlocking'
> & {
  price: number
  metadata: PurchaseableContentMetadata
}

export const PurchaseContentFormFields = ({
  price,
  purchaseSummaryValues,
  stage,
  isUnlocking,
  metadata
}: PurchaseContentFormFieldsProps) => {
  const payExtraAmountPresetValues = usePayExtraPresets()
  const coinflowMaximumCents = useRemoteVar(IntKeys.COINFLOW_MAXIMUM_CENTS)
  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.BUY_WITH_COINFLOW
  )
  const { isEnabled: isPayWithAnythingEnabledFlag } = useFeatureFlag(
    FeatureFlags.PAY_WITH_ANYTHING_ENABLED
  )
  const isPayWithAnythingEnabled =
    isPayWithAnythingEnabledFlag && !!window.solana

  const [{ value: purchaseMethod }, , { setValue: setPurchaseMethod }] =
    useField(PURCHASE_METHOD)
  const [{ value: purchaseVendor }, , { setValue: setPurchaseVendor }] =
    useField(PURCHASE_VENDOR)
  const [{ value: isGuestCheckout }] = useField(GUEST_CHECKOUT)

  const [
    { value: purchaseMethodMintAddress },
    ,
    { setValue: setPurchaseMethodMintAddress }
  ] = useField(PURCHASE_METHOD_MINT_ADDRESS)
  const isPurchased = stage === PurchaseContentStage.FINISH

  const { data: balanceBN } = useUSDCBalance({
    isPolling: true,
    commitment: 'confirmed'
  })
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
  console.log('asdf price', totalPriceInCents)

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
        <IconValidationCheck size='m' />
        <Text variant='heading' size='s'>
          {messages.purchaseSuccessful}
        </Text>
      </Flex>
    )
  }

  const isAlbumPurchase = isPurchaseableAlbum(metadata)
  const stemsPurchaseCount =
    'is_download_gated' in metadata && metadata.is_download_gated
      ? metadata._stems?.length ?? 0
      : 0
  const downloadPurchaseCount =
    'is_download_gated' in metadata &&
    metadata.is_download_gated &&
    metadata.is_downloadable
      ? 1
      : 0
  const streamPurchaseCount = metadata.is_stream_gated ? 1 : 0

  return (
    <>
      {isUnlocking || isPurchased ? null : (
        <Box ph='m'>
          <PayExtraFormSection
            amountPresets={payExtraAmountPresetValues}
            disabled={isUnlocking}
          />
        </Box>
      )}
      <PurchaseSummaryTable
        {...purchaseSummaryValues}
        stemsPurchaseCount={stemsPurchaseCount}
        downloadPurchaseCount={downloadPurchaseCount}
        streamPurchaseCount={streamPurchaseCount}
        totalPriceInCents={totalPriceInCents}
        isAlbumPurchase={isAlbumPurchase}
      />
      {/* {isGuestCheckout ? (
        <Flex direction='column' gap='l'>
          <Text variant='title'>Contact Details</Text>
          <HarmonyTextField name='guestEmail' label='Email' />
        </Flex>
      ) : null} */}
      {isUnlocking || isPurchased ? null : (
        <PaymentMethod
          selectedMethod={purchaseMethod}
          setSelectedMethod={handleChangeMethod}
          selectedVendor={purchaseVendor}
          setSelectedVendor={handleChangeVendor}
          selectedPurchaseMethodMintAddress={purchaseMethodMintAddress}
          setSelectedPurchaseMethodMintAddress={setPurchaseMethodMintAddress}
          balance={balanceBN}
          isExistingBalanceDisabled={isExistingBalanceDisabled}
          showExistingBalance={!!(balanceBN && !balanceBN.isZero())}
          isCoinflowEnabled={showCoinflow}
          isPayWithAnythingEnabled={isPayWithAnythingEnabled}
          showVendorChoice={false}
        />
      )}
      {isUnlocking ? null : <PayToUnlockInfo />}
    </>
  )
}
