import { useFeatureFlag, useAccessAndRemixSettings } from '@audius/common/hooks'
import {
  AccessConditions,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  IconVisibilityHidden,
  RadioGroup,
  IconSpecialAccess,
  IconVisibilityPublic,
  Text,
  IconQuestionCircle,
  Hint
} from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'

import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useFlag } from 'hooks/useRemoteConfig'
import { pluralize } from 'utils/stringUtils'

import { SingleTrackEditValues } from '../../../pages/upload-page/types'

import styles from './AccessAndSaleField.module.css'
import { HiddenAvailabilityFields } from './stream-availability/HiddenAvailabilityFields'
import { SpecialAccessFields } from './stream-availability/SpecialAccessFields'
import { CollectibleGatedRadioField } from './stream-availability/collectible-gated/CollectibleGatedRadioField'
import { UsdcPurchaseGatedRadioField } from './stream-availability/usdc-purchase-gated/UsdcPurchaseGatedRadioField'
import { STREAM_AVAILABILITY_TYPE, STREAM_CONDITIONS } from './types'

const messages = {
  title: 'Access & Sale',
  modalDescription:
    'Control who has access to listen. Create gated experiences or require users pay to unlock your music.',
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
  specialAccessSubtitle:
    'Special Access tracks are only available to users who meet certain criteria, such as following the artist.',
  hidden: 'Hidden',
  hiddenSubtitleTracks:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  hiddenSubtitleAlbums:
    'Hidden albums remain invisible to your followers, visible only to you on your profile. They can be shared and listened to via direct link.',
  hiddenHint: 'Scheduled tracks are hidden by default until release.',
  publishDisabled:
    'Publishing is disabled for empty albums and albums containing hidden tracks.'
}

export type AccesAndSaleMenuFieldsProps = {
  streamConditions: SingleTrackEditValues[typeof STREAM_CONDITIONS]
  isRemix: boolean
  isUpload?: boolean
  isAlbum?: boolean
  isInitiallyUnlisted?: boolean
  isScheduledRelease?: boolean
  initialStreamConditions?: AccessConditions | undefined
  isPublishDisabled?: boolean
}

export const AccessAndSaleMenuFields = (props: AccesAndSaleMenuFieldsProps) => {
  const {
    isRemix,
    isUpload,
    isAlbum,
    isInitiallyUnlisted,
    initialStreamConditions,
    isScheduledRelease,
    isPublishDisabled = false
  } = props

  const { isEnabled: isUsdcFlagUploadEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isPremiumAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )
  const isUsdcUploadEnabled = isAlbum
    ? isPremiumAlbumsEnabled && isUsdcFlagUploadEnabled
    : isUsdcFlagUploadEnabled

  const { isEnabled: isCollectibleGatedFlagEnabled } = useFlag(
    FeatureFlags.COLLECTIBLE_GATED_ENABLED
  )
  const { isEnabled: isSpecialAccessFlagEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_ENABLED
  )
  const isCollectibleGatedEnabled = !isAlbum && isCollectibleGatedFlagEnabled
  const isSpecialAccessEnabled = !isAlbum && isSpecialAccessFlagEnabled

  const [availabilityField] = useField({
    name: STREAM_AVAILABILITY_TYPE
  })

  const {
    disableSpecialAccessGate,
    disableSpecialAccessGateFields,
    disableHidden
  } = useAccessAndRemixSettings({
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
      <Text variant='body'>{messages.modalDescription}</Text>
      {isPublishDisabled ? <Hint>{messages.publishDisabled}</Hint> : null}
      <RadioGroup {...availabilityField} aria-label={messages.title}>
        <ModalRadioItem
          icon={<IconVisibilityPublic className={styles.icon} />}
          label={messages.public}
          description={messages.publicSubtitle(isAlbum ? 'album' : 'track')}
          value={StreamTrackAvailabilityType.PUBLIC}
          disabled={isPublishDisabled}
        />
        {isUsdcUploadEnabled ? (
          <UsdcPurchaseGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            isAlbum={isAlbum}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
            isPublishDisabled={isPublishDisabled}
          />
        ) : null}

        {isSpecialAccessEnabled ? (
          <ModalRadioItem
            icon={<IconSpecialAccess />}
            label={messages.specialAccess}
            description={messages.specialAccessSubtitle}
            value={StreamTrackAvailabilityType.SPECIAL_ACCESS}
            disabled={disableSpecialAccessGate}
            checkedContent={
              <SpecialAccessFields disabled={disableSpecialAccessGateFields} />
            }
          />
        ) : null}
        {isCollectibleGatedEnabled ? (
          <CollectibleGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}
        {!isAlbum ? (
          <ModalRadioItem
            icon={<IconVisibilityHidden />}
            label={messages.hidden}
            value={StreamTrackAvailabilityType.HIDDEN}
            description={
              isAlbum
                ? messages.hiddenSubtitleAlbums
                : messages.hiddenSubtitleTracks
            }
            disabled={disableHidden}
            // isInitiallyUnlisted is undefined on create
            // show hint on scheduled releases that are in create or already unlisted
            hintContent={
              isScheduledRelease && isInitiallyUnlisted !== false
                ? messages.hiddenHint
                : ''
            }
            checkedContent={isAlbum ? null : <HiddenAvailabilityFields />}
          />
        ) : null}
      </RadioGroup>
    </div>
  )
}
