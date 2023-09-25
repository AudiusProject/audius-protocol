import { useCallback, useEffect } from 'react'

import {
  BNUSDC,
  isPremiumContentUSDCPurchaseGated,
  PurchaseContentStage,
  Track,
  UserTrackMetadata,
  Name,
  Nullable,
  PremiumConditionsUSDCPurchase,
  formatPrice,
  usePurchaseContentFormState,
  usePurchaseSummaryValues,
  PurchaseContentFormState,
  payExtraAmountPresetValues,
  PurchaseContentSchema
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
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'
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

type RenderFormProps = PurchaseContentFormState &
  PurchaseContentFormProps & {
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

const isTrackPurchasable = (
  track: UserTrackMetadata
): track is PurchasableTrackMetadata =>
  isPremiumContentUSDCPurchaseGated(track.premium_conditions)

// Separating contents into a child so we can read form context
const RenderForm = ({
  currentBalance,
  track,
  onViewTrackClicked,
  stage,
  error,
  isUnlocking
}: RenderFormProps) => {
  const isPurchased = stage === PurchaseContentStage.FINISH
  const { handle } = track.user
  const { permalink, title } = track

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

  const purchaseSummaryValues = usePurchaseSummaryValues({
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

  const state = usePurchaseContentFormState({ track })

  useNavigateOnSuccess(track, state.stage)

  if (!isTrackPurchasable(track)) {
    console.error(
      `Loaded Purchase modal with a non-USDC-gated track: ${track.track_id}`
    )
    return null
  }

  return (
    <Formik
      initialValues={state.initialValues}
      validationSchema={toFormikValidationSchema(PurchaseContentSchema)}
      onSubmit={state.handleConfirmPurchase}
    >
      <RenderForm {...formProps} {...state} track={track} />
    </Formik>
  )
}
