import {
  AccessConditions,
  FeatureFlags,
  StreamTrackAvailabilityType,
  useAccessAndRemixSettings,
  useFeatureFlag
} from '@audius/common'
import {
  IconHidden,
  RadioButtonGroup,
  IconSpecialAccess,
  IconVisibilityPublic
} from '@audius/stems'
import cn from 'classnames'
import { useField } from 'formik'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { Text } from 'components/typography'
import { useFlag } from 'hooks/useRemoteConfig'

import { SingleTrackEditValues } from '../types'

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
  publicSubtitle:
    'Public tracks are visible to all users and appear throughout Audius.',
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access tracks are only available to users who meet certain criteria, such as following the artist.',
  hidden: 'Hidden',
  hiddenSubtitle:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  hiddenHint: 'Scheduled tracks are hidden by default until release.'
}

export type AccesAndSaleMenuFieldsProps = {
  streamConditions: SingleTrackEditValues[typeof STREAM_CONDITIONS]
  isRemix: boolean
  isUpload?: boolean
  isInitiallyUnlisted?: boolean
  isScheduledRelease?: boolean
  initialStreamConditions?: AccessConditions
}

export const AccessAndSaleMenuFields = (props: AccesAndSaleMenuFieldsProps) => {
  const {
    isRemix,
    isUpload,
    isInitiallyUnlisted,
    initialStreamConditions,
    isScheduledRelease
  } = props

  const { isEnabled: isUsdcEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isCollectibleGatedEnabled } = useFlag(
    FeatureFlags.COLLECTIBLE_GATED_ENABLED
  )
  const { isEnabled: isSpecialAccessEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_ENABLED
  )

  const [availabilityField] = useField({
    name: STREAM_AVAILABILITY_TYPE
  })

  const { noSpecialAccessGate, noSpecialAccessGateFields, noHidden } =
    useAccessAndRemixSettings({
      isUpload: !!isUpload,
      isRemix,
      initialStreamConditions: initialStreamConditions ?? null,
      isInitiallyUnlisted: !!isInitiallyUnlisted,
      isScheduledRelease: !!isScheduledRelease
    })

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      {isRemix ? <HelpCallout content={messages.isRemix} /> : null}
      <Text>{messages.modalDescription}</Text>
      <RadioButtonGroup {...availabilityField} aria-label={messages.title}>
        <ModalRadioItem
          icon={<IconVisibilityPublic className={styles.icon} />}
          label={messages.public}
          description={messages.publicSubtitle}
          value={StreamTrackAvailabilityType.PUBLIC}
        />
        {isUsdcEnabled ? (
          <UsdcPurchaseGatedRadioField
            isRemix={isRemix}
            isUpload={isUpload}
            initialStreamConditions={initialStreamConditions}
            isInitiallyUnlisted={isInitiallyUnlisted}
          />
        ) : null}

        {isSpecialAccessEnabled ? (
          <ModalRadioItem
            icon={<IconSpecialAccess />}
            label={messages.specialAccess}
            description={messages.specialAccessSubtitle}
            value={StreamTrackAvailabilityType.SPECIAL_ACCESS}
            disabled={noSpecialAccessGate}
            checkedContent={
              <SpecialAccessFields disabled={noSpecialAccessGateFields} />
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
        <ModalRadioItem
          icon={<IconHidden />}
          label={messages.hidden}
          value={StreamTrackAvailabilityType.HIDDEN}
          description={messages.hiddenSubtitle}
          disabled={noHidden}
          // isInitiallyUnlisted is undefined on create
          // show hint on scheduled releases that are in create or already unlisted
          hintContent={
            isScheduledRelease && isInitiallyUnlisted !== false
              ? messages.hiddenHint
              : ''
          }
          checkedContent={<HiddenAvailabilityFields />}
        />
      </RadioButtonGroup>
    </div>
  )
}
