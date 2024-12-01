import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  AccessConditions,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  RadioGroup,
  IconSpecialAccess,
  Text,
  IconQuestionCircle,
  Hint
} from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'

import { SingleTrackEditValues } from 'components/edit-track/types'
import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { pluralize } from 'utils/stringUtils'

import { SpecialAccessFields } from '../stream-availability/SpecialAccessFields'
import { CollectibleGatedRadioField } from '../stream-availability/collectible-gated/CollectibleGatedRadioField'
import { UsdcPurchaseGatedRadioField } from '../stream-availability/usdc-purchase-gated/UsdcPurchaseGatedRadioField'
import { STREAM_AVAILABILITY_TYPE, STREAM_CONDITIONS } from '../types'

const messages = {
  title: 'Price & Audience',
  modalDescription: '',
  free: 'Free for Everyone',
  freeSubtitle: (contentType: 'album' | 'track') =>
    `Everyone can play your ${contentType} for free.`,
  specialAccessSubtitle: 'Only fans who meet certain criteria can listen.',
  isRemix:
    'This track is marked as a remix. To enable additional availability options, unmark within Remix Settings.',
  done: 'Done',
  public: 'Public (Free to Stream)',
  publicSubtitle: (contentType: 'album' | 'track') =>
    `Public ${pluralize(
      contentType,
      2
    )} are visible to all users and appear throughout Audius.`,
  specialAccess: 'Special Access',
  hidden: 'Hidden',
  hiddenSubtitleTracks:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  hiddenSubtitleAlbums:
    'Hidden albums remain invisible to your followers, visible only to you on your profile. They can be shared and listened to via direct link.',
  hiddenHint: 'Scheduled tracks are hidden by default until release.',
  publishDisabled:
    'Publishing is disabled for empty albums and albums containing hidden tracks.',
  fromFreeHint: (
    contentType: 'album' | 'track',
    gatedType: 'gated' | 'premium'
  ) => `You can't make a free ${contentType} ${gatedType}.`
}

type PriceAndAudienceMenuFieldsProps = {
  streamConditions: SingleTrackEditValues[typeof STREAM_CONDITIONS]
  isRemix: boolean
  isUpload?: boolean
  isAlbum?: boolean
  isInitiallyUnlisted?: boolean
  isScheduledRelease?: boolean
  initialStreamConditions?: AccessConditions | undefined
  isPublishDisabled?: boolean
}

export const PriceAndAudienceMenuFields = (
  props: PriceAndAudienceMenuFieldsProps
) => {
  const {
    isRemix,
    isUpload,
    isAlbum,
    isInitiallyUnlisted,
    initialStreamConditions,
    isScheduledRelease,
    isPublishDisabled = false
  } = props

  const { isEnabled: isEditableAccessEnabled } = useFeatureFlag(
    FeatureFlags.EDITABLE_ACCESS_ENABLED
  )
  const { isEnabled: isUdscPurchaseEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isPremiumAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )

<<<<<<< Updated upstream
  const { isEnabled: isHiddenPaidScheduledEnabled } = useFeatureFlag(
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )
  const isUsdcUploadEnabled = isAlbum
    ? isPremiumAlbumsEnabled && isUdscPurchaseEnabled
    : isUdscPurchaseEnabled

=======
>>>>>>> Stashed changes
  const [availabilityField] = useField({ name: STREAM_AVAILABILITY_TYPE })

  const { disableSpecialAccessGate, disableSpecialAccessGateFields } =
    useAccessAndRemixSettings({
      isEditableAccessEnabled: !!isEditableAccessEnabled,
      isUpload: !!isUpload,
      isRemix,
      isAlbum,
      initialStreamConditions: initialStreamConditions ?? null,
      isInitiallyUnlisted: !!isInitiallyUnlisted,
      isScheduledRelease: !!isScheduledRelease,
      isPublishDisabled
    })

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      {isRemix ? (
        <Hint icon={IconQuestionCircle}>{messages.isRemix}</Hint>
      ) : null}
      {messages.modalDescription ? (
        <Text variant='body'>{messages.modalDescription}</Text>
      ) : (
        <div />
      )}
      {isPublishDisabled ? <Hint>{messages.publishDisabled}</Hint> : null}
      <RadioGroup {...availabilityField} aria-label={messages.title}>
<<<<<<< Updated upstream
        {isHiddenPaidScheduledEnabled ? (
          <ModalRadioItem
            label={messages.free}
            description={messages.freeSubtitle(isAlbum ? 'album' : 'track')}
            value={StreamTrackAvailabilityType.FREE}
            disabled={isPublishDisabled}
          />
        ) : (
          <ModalRadioItem
            icon={<IconVisibilityPublic />}
            label={messages.public}
            description={messages.publicSubtitle(isAlbum ? 'album' : 'track')}
            value={StreamTrackAvailabilityType.PUBLIC}
            disabled={isPublishDisabled}
          />
        )}
        {isUsdcUploadEnabled ? (
=======
        <ModalRadioItem
          label={messages.free}
          description={messages.freeSubtitle(isAlbum ? 'album' : 'track')}
          value={StreamTrackAvailabilityType.FREE}
          disabled={isPublishDisabled}
        />
        {isUdscPurchaseEnabled ? (
>>>>>>> Stashed changes
          <UsdcPurchaseGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            isAlbum={isAlbum}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
            isPublishDisabled={isPublishDisabled}
          />
        ) : null}

        {!isAlbum ? (
          <ModalRadioItem
            icon={<IconSpecialAccess />}
            label={messages.specialAccess}
            description={messages.specialAccessSubtitle}
            value={StreamTrackAvailabilityType.SPECIAL_ACCESS}
            disabled={disableSpecialAccessGate}
            checkedContent={
              <SpecialAccessFields disabled={disableSpecialAccessGateFields} />
            }
            tooltipText={messages.fromFreeHint(
              isAlbum ? 'album' : 'track',
              'gated'
            )}
          />
        ) : null}
        {!isAlbum ? (
          <CollectibleGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}
      </RadioGroup>
    </div>
  )
}
