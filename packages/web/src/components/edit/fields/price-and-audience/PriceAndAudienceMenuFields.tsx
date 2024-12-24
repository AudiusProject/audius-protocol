import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import { StreamTrackAvailabilityType } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { pluralize } from '@audius/common/utils'
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
    isScheduledRelease,
    isPublishDisabled = false
  } = props

  const { isEnabled: isUdscPurchaseEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )

  const [availabilityField] = useField({ name: STREAM_AVAILABILITY_TYPE })

  const { disableSpecialAccessGate, disableSpecialAccessGateFields } =
    useAccessAndRemixSettings({
      isUpload: !!isUpload,
      isRemix,
      isAlbum,
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
        <ModalRadioItem
          label={messages.free}
          description={messages.freeSubtitle(isAlbum ? 'album' : 'track')}
          value={StreamTrackAvailabilityType.FREE}
          disabled={isPublishDisabled}
        />
        {isUdscPurchaseEnabled ? (
          <UsdcPurchaseGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            isAlbum={isAlbum}
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
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}
      </RadioGroup>
    </div>
  )
}
