import { useCallback, useEffect } from 'react'

import {
  BNUSDC,
  getPurchaseSummaryValues,
  ContentType,
  isContentPurchaseInProgress,
  isPremiumContentUSDCPurchaseGated,
  purchaseContentActions,
  purchaseContentSelectors,
  PurchaseContentStage,
  Track,
  UserTrackMetadata,
  Name,
  Nullable,
  PremiumConditionsUSDCPurchase,
  formatPrice
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyPlainButton,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType,
  IconCaretRight,
  IconCheck,
  IconError
} from '@audius/stems'
import { Form, Formik, useField } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { make } from 'common/store/analytics/actions'
import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { TwitterShareButton } from 'components/twitter-share-button/TwitterShareButton'
import { Text } from 'components/typography'
import { fullTrackPage, pushUniqueRoute } from 'utils/route'

import { PayExtraFormSection } from './PayExtraFormSection'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseContentForm.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'
import {
  AMOUNT_PRESET,
  CUSTOM_AMOUNT,
  payExtraAmountPresetValues
} from './constants'
import { PayExtraPreset } from './types'
import { PurchaseContentSchema, PurchaseContentValues } from './validation'

const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const messages = {
  buy: 'Buy',
  purchasing: 'Purchasing',
  purchaseSuccessful: 'Your Purchase Was Successful!',
  error: 'Your purchase was unsuccessful.',
  shareButtonContent: 'I just purchased a track on Audius!',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `I bought the track ${trackTitle} by ${handle} on Audius! #AudiusPremium`,
  viewTrack: 'View Track'
}

export type PurchaseContentFormProps = {
  currentBalance: Nullable<BNUSDC>
  track: UserTrackMetadata
  onViewTrackClicked: () => void
}

type PurchasableTrackMetadata = UserTrackMetadata & {
  premium_conditions: PremiumConditionsUSDCPurchase
}

type RenderFormProps = PurchaseContentFormProps & {
  track: PurchasableTrackMetadata
}

const useNavigateOnSuccess = (
  track: UserTrackMetadata,
  stage: PurchaseContentStage
) => {
  const dispatch = useDispatch()
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH) {
      dispatch(pushUniqueRoute(track.permalink))
    }
  }, [stage, track, dispatch])
}

const ContentPurchaseError = () => {
  return (
    <Text className={styles.errorContainer} color='accentRed'>
      <Icon icon={IconError} size='medium' />
      {messages.error}
    </Text>
  )
}

const getExtraAmount = (amountPreset: PayExtraPreset, customAmount = 0) => {
  let extraAmount = 0
  switch (amountPreset) {
    case PayExtraPreset.LOW:
    case PayExtraPreset.MEDIUM:
    case PayExtraPreset.HIGH:
      extraAmount = payExtraAmountPresetValues[amountPreset]
      break
    case PayExtraPreset.CUSTOM:
      extraAmount = Number.isFinite(customAmount) ? customAmount : 0
      break
    default:
      break
  }
  return extraAmount
}

const isTrackPurchasable = (
  track: UserTrackMetadata
): track is PurchasableTrackMetadata =>
  isPremiumContentUSDCPurchaseGated(track.premium_conditions)

// Separating contents into a child so we can read form context
const RenderForm = ({
  currentBalance,
  track,
  onViewTrackClicked
}: RenderFormProps) => {
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const isPurchased = stage === PurchaseContentStage.FINISH
  const { handle } = track.user
  const { permalink, title } = track
  const [{ value: customAmount }] = useField(CUSTOM_AMOUNT)
  const [{ value: extraAmountPreset }] = useField(AMOUNT_PRESET)

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.shareTwitterText(title, handle)
      const analytics = make(Name.PURCHASE_CONTENT_TWITTER_SHARE, {
        text: shareText
      })
      return { shareText, analytics }
    },
    [title]
  )

  const { price } = track.premium_conditions.usdc_purchase
  const extraAmount = getExtraAmount(extraAmountPreset, customAmount)

  const purchaseSummaryValues = getPurchaseSummaryValues({
    // Passing undefined for the None case so that the row doesn't render.
    // In other cases, the user may have input 0 and we want to show the row
    // to reflect that until they explicitly select no preset
    extraAmount:
      extraAmountPreset === PayExtraPreset.NONE ? undefined : extraAmount,
    price,
    currentBalance
  })
  const { amountDue } = purchaseSummaryValues

  const textContent = isUnlocking ? (
    <div className={styles.purchaseButtonText}>
      <LoadingSpinner className={styles.purchaseButtonSpinner} />
      <span>{messages.purchasing}</span>
    </div>
  ) : amountDue > 0 ? (
    <div className={styles.purchaseButtonText}>
      {messages.buy}
      <span>{`$${formatPrice(amountDue)}`}</span>
    </div>
  ) : (
    messages.buy
  )

  return (
    <Form className={styles.container}>
      <LockedTrackDetailsTile
        // TODO: Remove this cast once typing is correct
        // https://linear.app/audius/issue/C-2899/fix-typing-for-computed-properties
        track={track as unknown as Track}
        owner={track.user}
      />
      {isPurchased ? (
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
          <TwitterShareButton
            fullWidth
            type='dynamic'
            url={fullTrackPage(permalink)}
            shareData={handleTwitterShare}
            handle={handle}
          />
          <HarmonyPlainButton
            onClick={onViewTrackClicked}
            iconRight={IconCaretRight}
            variant={HarmonyPlainButtonType.SUBDUED}
            size={HarmonyPlainButtonSize.LARGE}
            text={messages.viewTrack}
          />
        </>
      ) : (
        <>
          <PayExtraFormSection amountPresets={payExtraAmountPresetValues} />
          <PurchaseSummaryTable
            {...purchaseSummaryValues}
            isPurchased={isPurchased}
          />
          <PayToUnlockInfo />
          <HarmonyButton
            disabled={isUnlocking}
            color='specialLightGreen'
            type='submit'
            text={textContent}
            fullWidth
          />
        </>
      )}
      {error ? <ContentPurchaseError /> : null}
    </Form>
  )
}

export const PurchaseContentForm = (props: PurchaseContentFormProps) => {
  const { track, ...formProps } = props
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE
  }

  const handleSubmit = useCallback(
    ({ customAmount, amountPreset }: PurchaseContentValues) => {
      if (isUnlocking) return

      const extraAmount = getExtraAmount(amountPreset, customAmount)

      dispatch(
        startPurchaseContentFlow({
          extraAmount,
          extraAmountPreset: amountPreset,
          contentId: track.track_id,
          contentType: ContentType.TRACK
        })
      )
    },
    [isUnlocking, dispatch, track.track_id]
  )

  useNavigateOnSuccess(track, stage)

  if (!isTrackPurchasable(track)) {
    console.error(
      `Loaded Purchase modal with a non-USDC-gated track: ${track.track_id}`
    )
    return null
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(PurchaseContentSchema)}
      onSubmit={handleSubmit}
    >
      <RenderForm {...formProps} track={track} />
    </Formik>
  )
}
