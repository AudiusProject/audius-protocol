import { useCallback, type ReactNode } from 'react'

import {
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  useGetTrackById,
  purchaseContentSelectors,
  purchaseContentActions,
  PurchaseContentStage,
  combineStatuses,
  useUSDCBalance,
  getPurchaseSummaryValues,
  statusIsNotFinalized
} from '@audius/common'
import { Linking, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import IconError from 'app/assets/images/iconError.svg'
import { LockedStatusBadge, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import LoadingSpinner from '../loading-spinner/LoadingSpinner'
import { TrackDetailsTile } from '../track-details-tile'

import { PurchaseSuccess } from './PurchaseSuccess'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'
import { StripePurchaseConfirmationButton } from './StripePurchaseConfirmationButton'

const { getPurchaseContentError, getPurchaseContentFlowStage } =
  purchaseContentSelectors

const PREMIUM_TRACK_PURCHASE_MODAL_NAME = 'PremiumTrackPurchase'

const messages = {
  title: 'Complete Purchase',
  summary: 'Summary',
  artistCut: 'Artist Cut',
  audiusCut: 'Audius Cut',
  alwaysZero: 'Always $0',
  youPay: 'You Pay',
  youPaid: 'You Paid',
  price: (price: string) => `$${price}`,
  payToUnlock: 'Pay-To-Unlock',
  disclaimer: (termsOfUse: ReactNode) => (
    <>
      {'By clicking on "Buy", you agree to our '}
      {termsOfUse}
      {
        ' Your purchase will be made in USDC via 3rd party payment provider. Additional payment provider fees may apply. Any remaining USDC balance in your Audius wallet will be applied to this transaction. Once your payment is confirmed, your premium content will be unlocked and available to stream.'
      }
    </>
  ),
  termsOfUse: 'Terms of Use.',
  error: 'Your purchase was unsuccessful.'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    paddingTop: spacing(6),
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(8),
    gap: spacing(6),
    backgroundColor: palette.white
  },
  titleContainer: {
    ...flexRowCentered(),
    gap: spacing(2),
    marginBottom: spacing(2),
    alignSelf: 'center'
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight2,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.xl * 1.25
  },
  trackTileContainer: {
    ...flexRowCentered(),
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: spacing(2),
    backgroundColor: palette.neutralLight10
  },
  payToUnlockTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    marginBottom: spacing(2)
  },
  errorContainer: {
    ...flexRowCentered(),
    gap: spacing(2)
  },
  spinnerContainer: {
    width: '100%',
    height: '90%',
    justifyContent: 'center',
    ...flexRowCentered()
  },
  disclaimer: {
    lineHeight: 20
  }
}))

export const PremiumTrackPurchaseDrawer = () => {
  const styles = useStyles()
  const { neutralLight2, accentRed, secondary } = useThemeColors()
  const dispatch = useDispatch()
  const isUSDCEnabled = useIsUSDCEnabled()
  const { data } = useDrawer('PremiumTrackPurchase')
  const { trackId } = data
  const { data: track, status: trackStatus } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
  const { data: currentBalance, status: balanceStatus } = useUSDCBalance()
  const error = useSelector(getPurchaseContentError)
  const stage = useSelector(getPurchaseContentFlowStage)
  const isPurchaseSuccessful = stage === PurchaseContentStage.FINISH
  const { premium_conditions: premiumConditions } = track ?? {}
  const isLoading = statusIsNotFinalized(
    combineStatuses([trackStatus, balanceStatus])
  )

  const handleClosed = useCallback(() => {
    dispatch(purchaseContentActions.cleanup())
  }, [dispatch])

  const handleTermsPress = useCallback(() => {
    Linking.openURL('https://audius.co/legal/terms-of-use')
  }, [])

  if (
    !track ||
    !isPremiumContentUSDCPurchaseGated(premiumConditions) ||
    !isUSDCEnabled
  )
    return null

  const price = premiumConditions.usdc_purchase.price
  const purchaseSummaryValues = getPurchaseSummaryValues({
    price,
    currentBalance
  })

  return (
    <NativeDrawer
      drawerName={PREMIUM_TRACK_PURCHASE_MODAL_NAME}
      onClosed={handleClosed}
    >
      {isLoading ? (
        <View style={styles.spinnerContainer}>
          <LoadingSpinner />
        </View>
      ) : (
        <View style={styles.drawer}>
          <View style={styles.titleContainer}>
            <IconCart fill={neutralLight2} />
            <Text style={styles.title}>{messages.title}</Text>
          </View>
          <TrackDetailsTile trackId={track.track_id} />
          <PurchaseSummaryTable
            {...purchaseSummaryValues}
            isPurchaseSuccessful={isPurchaseSuccessful}
          />
          {isPurchaseSuccessful ? (
            <PurchaseSuccess track={track} />
          ) : (
            <>
              <View>
                <View style={styles.payToUnlockTitleContainer}>
                  <Text
                    weight='heavy'
                    textTransform='uppercase'
                    fontSize='small'
                  >
                    {messages.payToUnlock}
                  </Text>
                  <LockedStatusBadge locked />
                </View>
                <Text style={styles.disclaimer}>
                  {messages.disclaimer(
                    <Text colorValue={secondary} onPress={handleTermsPress}>
                      {messages.termsOfUse}
                    </Text>
                  )}
                </Text>
              </View>
              <StripePurchaseConfirmationButton
                trackId={track.track_id}
                price={formatPrice(price)}
              />
            </>
          )}
          {error ? (
            <View style={styles.errorContainer}>
              <IconError
                fill={accentRed}
                width={spacing(5)}
                height={spacing(5)}
              />
              <Text weight='medium' colorValue={accentRed}>
                {messages.error}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </NativeDrawer>
  )
}
