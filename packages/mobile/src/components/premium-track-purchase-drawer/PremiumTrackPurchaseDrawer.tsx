import { useCallback, type ReactNode, useEffect } from 'react'

import type {
  PurchasableTrackMetadata,
  PurchaseContentError
} from '@audius/common'
import {
  PurchaseContentStage,
  formatPrice,
  isContentPurchaseInProgress,
  isTrackPurchasable,
  purchaseContentActions,
  purchaseContentSelectors,
  statusIsNotFinalized,
  useGetTrackById,
  usePayExtraPresets,
  usePurchaseContentErrorMessage,
  usePurchaseContentFormConfiguration
} from '@audius/common'
import { Formik, useFormikContext } from 'formik'
import { Linking, View, ScrollView, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import IconCart from 'app/assets/images/iconCart.svg'
import IconCloseAlt from 'app/assets/images/iconCloseAlt.svg'
import IconError from 'app/assets/images/iconError.svg'
import { Button, LockedStatusBadge, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import LoadingSpinner from '../loading-spinner/LoadingSpinner'
import { TrackDetailsTile } from '../track-details-tile'

import { AudioMatchSection } from './AudioMatchSection'
import { PayExtraFormSection } from './PayExtraFormSection'
import { PurchaseSuccess } from './PurchaseSuccess'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'
import { usePurchaseContentFormState } from './hooks/usePurchaseContentFormState'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const PREMIUM_TRACK_PURCHASE_MODAL_NAME = 'PremiumTrackPurchase'

const messages = {
  buy: 'Buy',
  title: 'Complete Purchase',
  summary: 'Summary',
  artistCut: 'Artist Cut',
  audiusCut: 'Audius Cut',
  alwaysZero: 'Always $0',
  youPay: 'You Pay',
  youPaid: 'You Paid',
  price: (price: string) => `$${price}`,
  payToUnlock: 'Pay-To-Unlock',
  purchasing: 'Purchasing',
  disclaimer: (termsOfUse: ReactNode) => (
    <>
      {'By clicking on "Buy", you agree to our '}
      {termsOfUse}
      {
        ' Your purchase will be made in USDC via 3rd party payment provider. Additional payment provider fees may apply. Any remaining USDC balance in your Audius wallet will be applied to this transaction. Once your payment is confirmed, your premium content will be unlocked and available to stream.'
      }
    </>
  ),
  termsOfUse: 'Terms of Use.'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  formContainer: {
    flex: 1
  },
  formContentContainer: {
    paddingVertical: spacing(6),
    gap: spacing(4)
  },
  formContentSection: {
    paddingHorizontal: spacing(4),
    gap: spacing(4)
  },
  formActions: {
    flex: 0,
    paddingTop: spacing(4),
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(6),
    gap: spacing(4)
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: spacing(10),
    paddingHorizontal: spacing(4)
  },
  titleContainer: {
    ...flexRowCentered(),
    gap: spacing(2),
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    // Matches close icon width
    paddingRight: spacing(6)
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

const RenderError = ({ error: { code } }: { error: PurchaseContentError }) => {
  const styles = useStyles()
  const { accentRed } = useThemeColors()
  return (
    <View style={styles.errorContainer}>
      <IconError fill={accentRed} width={spacing(5)} height={spacing(5)} />
      <Text weight='medium' color='accentRed'>
        {usePurchaseContentErrorMessage(code, useRemoteVar)}
      </Text>
    </View>
  )
}

const PremiumTrackPurchaseDrawerHeader = ({
  onClose
}: {
  onClose: () => void
}) => {
  const styles = useStyles()
  const { neutralLight2, neutralLight4 } = useThemeColors()
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
        <IconCloseAlt
          width={spacing(6)}
          height={spacing(6)}
          fill={neutralLight4}
        />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <IconCart width={spacing(6)} height={spacing(6)} fill={neutralLight2} />
        <Text
          variant='label'
          fontSize='large'
          color='neutralLight2'
          weight='heavy'
          textTransform='uppercase'
          noGutter
        >
          {messages.title}
        </Text>
      </View>
    </View>
  )
}

const getButtonText = (isUnlocking: boolean, amountDue: number) =>
  isUnlocking
    ? messages.purchasing
    : amountDue > 0
    ? `${messages.buy} $${formatPrice(amountDue)}`
    : messages.buy

// The bulk of the form rendering is in a nested component because we want access
// to the FormikContext, which can only be used in a component which is a descendant
// of the `<Formik />` component
const RenderForm = ({ track }: { track: PurchasableTrackMetadata }) => {
  const navigation = useNavigation()
  const styles = useStyles()
  const { specialLightGreen, secondary } = useThemeColors()
  const presetValues = usePayExtraPresets(useRemoteVar)

  const { submitForm, resetForm } = useFormikContext()

  // Reset form on track change
  useEffect(() => resetForm, [track.track_id, resetForm])

  const {
    premium_conditions: {
      usdc_purchase: { price }
    }
  } = track

  const { stage, error, isUnlocking, purchaseSummaryValues } =
    usePurchaseContentFormState({ price })
  const { amountDue } = purchaseSummaryValues

  const isPurchaseSuccessful = stage === PurchaseContentStage.FINISH
  const isInProgress = isContentPurchaseInProgress(stage)

  // Navigate to track screen in the background if purchase is successful
  useEffect(() => {
    if (isPurchaseSuccessful) {
      navigation.navigate('Track', { id: track.track_id })
    }
  }, [isPurchaseSuccessful, navigation, track.track_id])

  const handleTermsPress = useCallback(() => {
    Linking.openURL('https://audius.co/legal/terms-of-use')
  }, [])

  return (
    <>
      <ScrollView contentContainerStyle={styles.formContentContainer}>
        <View style={styles.formContentSection}>
          <TrackDetailsTile trackId={track.track_id} />
        </View>
        {stage !== PurchaseContentStage.FINISH ? (
          <AudioMatchSection amount={Math.round(price / 100)} />
        ) : null}
        <View style={styles.formContentSection}>
          {isPurchaseSuccessful ? null : (
            <PayExtraFormSection
              amountPresets={presetValues}
              isDisabled={isInProgress}
            />
          )}
          <PurchaseSummaryTable
            {...purchaseSummaryValues}
            isPurchaseSuccessful={isPurchaseSuccessful}
          />
          {isPurchaseSuccessful ? (
            <PurchaseSuccess track={track} />
          ) : (
            <View>
              <View style={styles.payToUnlockTitleContainer}>
                <Text weight='heavy' textTransform='uppercase' fontSize='small'>
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
          )}
        </View>
      </ScrollView>
      {isPurchaseSuccessful ? null : (
        <View style={styles.formActions}>
          {error ? <RenderError error={error} /> : null}
          <Button
            onPress={submitForm}
            disabled={isUnlocking}
            title={getButtonText(isUnlocking, amountDue)}
            variant={'primary'}
            size='large'
            color={specialLightGreen}
            iconPosition='left'
            icon={isUnlocking ? LoadingSpinner : undefined}
            fullWidth
          />
        </View>
      )}
    </>
  )
}

export const PremiumTrackPurchaseDrawer = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const isUSDCEnabled = useIsUSDCEnabled()
  const presetValues = usePayExtraPresets(useRemoteVar)
  const { data } = useDrawer('PremiumTrackPurchase')
  const { trackId } = data
  const { data: track, status: trackStatus } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const isLoading = statusIsNotFinalized(trackStatus)

  const { initialValues, onSubmit, validationSchema } =
    usePurchaseContentFormConfiguration({ track, presetValues })

  const handleClosed = useCallback(() => {
    dispatch(purchaseContentActions.cleanup())
  }, [dispatch])

  if (!track || !isTrackPurchasable(track) || !isUSDCEnabled) return null

  return (
    <NativeDrawer
      blockClose={isUnlocking}
      drawerHeader={PremiumTrackPurchaseDrawerHeader}
      drawerName={PREMIUM_TRACK_PURCHASE_MODAL_NAME}
      onClosed={handleClosed}
      isGestureSupported={false}
      isFullscreen
    >
      {isLoading ? (
        <View style={styles.spinnerContainer}>
          <LoadingSpinner />
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Formik
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(validationSchema)}
            onSubmit={onSubmit}
          >
            <RenderForm track={track} />
          </Formik>
        </View>
      )}
    </NativeDrawer>
  )
}
