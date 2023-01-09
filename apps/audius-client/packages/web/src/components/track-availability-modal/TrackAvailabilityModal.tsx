import { MouseEvent, useCallback } from 'react'

import { FeatureFlags, Nullable, PremiumConditions } from '@audius/common'
import {
  IconSpecialAccess,
  IconCollectible,
  IconVisibilityPublic,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  IconHidden,
  ButtonType,
  Button,
  IconInfo
} from '@audius/stems'
import cn from 'classnames'

import Tooltip from 'components/tooltip/Tooltip'
import { useFlag } from 'hooks/useRemoteConfig'

import Switch from '../switch/Switch'

import styles from './TrackAvailabilityModal.module.css'

const messages = {
  title: 'AVAILABILITY',
  hideTrack: 'Hide Track',
  public: 'Public (Default)',
  publicSubtitle:
    'Public uploads will appear throughout Audius and will be visible to all users.',
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access content is only available to users who meet your pre-specified criteria.',
  collectibleGated: 'Collectible Gated',
  collectibleGatedSubtitle:
    'Collectible gated content can only be accessed by users with linked wallets containing a collectible from the specified collection. These tracks do not appear on trending or in user feeds.',
  hidden: 'Hidden',
  hiddenSubtitle:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only',
  showUnlisted: 'Show Unlisted',
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count',
  supportersInfo: 'Supporters are users who have sent you a tip',
  done: 'Done'
}

const defaultAvailabilityFields = {
  is_premium: false,
  premium_conditions: null,
  unlisted: false,
  genre: true,
  mood: true,
  tags: true,
  plays: false,
  share: false
}

enum AvailabilityType {
  PUBLIC = 'PUBLIC',
  SPECIAL_ACCESS = 'SPECIAL_ACCESS',
  COLLECTIBLE_GATED = 'COLLECTIBLE_GATED',
  HIDDEN = 'HIDDEN'
}

enum PremiumTrackMetadataField {
  IS_PREMIUM = 'is_premium',
  PREMIUM_CONDITIONS = 'premium_conditions'
}

enum UnlistedTrackMetadataField {
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

// The order of toggles in the modal
const unlistedTrackMetadataOrder = [
  UnlistedTrackMetadataField.GENRE,
  UnlistedTrackMetadataField.MOOD,
  UnlistedTrackMetadataField.TAGS,
  UnlistedTrackMetadataField.SHARE,
  UnlistedTrackMetadataField.PLAYS
]

const hiddenTrackMetadataMap = {
  [UnlistedTrackMetadataField.UNLISTED]: '',
  [UnlistedTrackMetadataField.GENRE]: messages.showGenre,
  [UnlistedTrackMetadataField.MOOD]: messages.showMood,
  [UnlistedTrackMetadataField.TAGS]: messages.showTags,
  [UnlistedTrackMetadataField.SHARE]: messages.showShareButton,
  [UnlistedTrackMetadataField.PLAYS]: messages.showPlayCount
}

type TrackMetadataState = {
  [PremiumTrackMetadataField.IS_PREMIUM]: boolean
  [PremiumTrackMetadataField.PREMIUM_CONDITIONS]: Nullable<PremiumConditions>
  [UnlistedTrackMetadataField.UNLISTED]: boolean
  [UnlistedTrackMetadataField.GENRE]: boolean
  [UnlistedTrackMetadataField.MOOD]: boolean
  [UnlistedTrackMetadataField.TAGS]: boolean
  [UnlistedTrackMetadataField.SHARE]: boolean
  [UnlistedTrackMetadataField.PLAYS]: boolean
}

type TrackMetadataSectionProps = {
  title: string
  isVisible: boolean
  isDisabled: boolean
  didSet: (enabled: boolean) => void
}

// Individual section of the modal.
const TrackMetadataSection = ({
  title,
  isVisible,
  isDisabled,
  didSet
}: TrackMetadataSectionProps) => {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitleClassname}>{title}</span>
      <div className={styles.switchContainer}>
        <Switch
          isOn={isVisible}
          handleToggle={(e: MouseEvent) => {
            e.stopPropagation()
            didSet(!isVisible)
          }}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  )
}

type TrackAvailabilityModalProps = {
  isOpen: boolean
  metadataState: TrackMetadataState
  didUpdateState: (newState: TrackMetadataState) => void
  onClose: () => void
}

type TrackAvailabilitySelectionProps = {
  selected: boolean
  metadataState: TrackMetadataState
  handleSelection: (availability: AvailabilityType) => void
  updateHiddenField?: (field: string) => (visible: boolean) => void
  updatePremiumContentFields?: (premiumConditions: PremiumConditions) => void
}

const PublicAvailability = ({
  selected,
  handleSelection
}: TrackAvailabilitySelectionProps) => {
  return (
    <div
      className={styles.availabilityRowContent}
      onClick={() => handleSelection(AvailabilityType.PUBLIC)}
    >
      <div
        className={cn(styles.availabilityRowTitle, {
          [styles.selected]: selected
        })}
      >
        <IconVisibilityPublic className={styles.availabilityRowIcon} />
        <span>{messages.public}</span>
      </div>
      <div className={styles.availabilityRowDescription}>
        {messages.publicSubtitle}
      </div>
    </div>
  )
}

const SpecialAccessAvailability = ({
  selected,
  handleSelection,
  updatePremiumContentFields
}: TrackAvailabilitySelectionProps) => {
  return (
    <div
      className={styles.availabilityRowContent}
      onClick={() => handleSelection(AvailabilityType.SPECIAL_ACCESS)}
    >
      <div
        className={cn(styles.availabilityRowTitle, {
          [styles.selected]: selected
        })}
      >
        <IconSpecialAccess className={styles.availabilityRowIcon} />
        <span>{messages.specialAccess}</span>
      </div>
      <div className={styles.availabilityRowDescription}>
        {messages.specialAccessSubtitle}
      </div>
      {selected && (
        <div className={styles.availabilityRowSelection}>
          <div>{messages.followersOnly}</div>
          <div>
            {messages.supportersOnly}
            <Tooltip
              text={messages.supportersInfo}
              mouseEnterDelay={0.1}
              mount='body'
            >
              <IconInfo className={styles.supportersInfo} />
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  )
}

const CollectibleGatedAvailability = ({
  selected,
  handleSelection,
  updatePremiumContentFields
}: TrackAvailabilitySelectionProps) => {
  return (
    <div
      className={styles.availabilityRowContent}
      onClick={() => handleSelection(AvailabilityType.COLLECTIBLE_GATED)}
    >
      <div
        className={cn(styles.availabilityRowTitle, {
          [styles.selected]: selected
        })}
      >
        <IconCollectible className={styles.availabilityRowIcon} />
        <span>{messages.collectibleGated}</span>
      </div>
      <div className={styles.availabilityRowDescription}>
        {messages.collectibleGatedSubtitle}
      </div>
      {selected && <div className={styles.availabilityRowSelection}>yolo</div>}
    </div>
  )
}

const HiddenAvailability = ({
  selected,
  metadataState,
  handleSelection,
  updateHiddenField
}: TrackAvailabilitySelectionProps) => {
  return (
    <div
      className={styles.availabilityRowContent}
      onClick={() => handleSelection(AvailabilityType.HIDDEN)}
    >
      <div
        className={cn(styles.availabilityRowTitle, {
          [styles.selected]: selected
        })}
      >
        <IconHidden className={styles.availabilityRowIcon} />
        <span>{messages.hidden}</span>
      </div>
      <div className={styles.availabilityRowDescription}>
        {messages.hiddenSubtitle}
      </div>
      {selected && (
        <div
          className={cn(styles.availabilityRowSelection, styles.hiddenSection)}
        >
          <div>
            {unlistedTrackMetadataOrder.slice(0, 3).map((label, i) => {
              return (
                <TrackMetadataSection
                  key={i}
                  isDisabled={false}
                  isVisible={metadataState[label]}
                  title={hiddenTrackMetadataMap[label]}
                  didSet={updateHiddenField!(label)}
                />
              )
            })}
          </div>
          <div>
            {unlistedTrackMetadataOrder.slice(3).map((label, i) => {
              return (
                <TrackMetadataSection
                  key={i}
                  isDisabled={false}
                  isVisible={metadataState[label]}
                  title={hiddenTrackMetadataMap[label]}
                  didSet={updateHiddenField!(label)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// A modal that allows you to toggle a track to unlisted, as
// well as toggle individual metadata field visibility.
const TrackAvailabilityModal = ({
  isOpen,
  metadataState,
  didUpdateState,
  onClose
}: TrackAvailabilityModalProps) => {
  const { isEnabled: isNFTGateEnabled } = useFlag(FeatureFlags.NFT_GATE_ENABLED)
  const { isEnabled: isSpecialAccessGateEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_GATE_ENABLED
  )

  let availability = AvailabilityType.PUBLIC
  if (metadataState.unlisted) {
    availability = AvailabilityType.HIDDEN
  } else if (
    metadataState.is_premium &&
    metadataState.premium_conditions &&
    'nft_collection' in metadataState.premium_conditions
  ) {
    availability = AvailabilityType.COLLECTIBLE_GATED
  } else if (metadataState.is_premium) {
    availability = AvailabilityType.SPECIAL_ACCESS
  }

  const handleSelection = useCallback(
    (availability: AvailabilityType) => {
      if (availability === AvailabilityType.PUBLIC) {
        didUpdateState({ ...defaultAvailabilityFields })
      } else if (availability === AvailabilityType.SPECIAL_ACCESS) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true
        })
      } else if (availability === AvailabilityType.COLLECTIBLE_GATED) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true,
          premium_conditions: { nft_collection: undefined }
        })
      } else {
        didUpdateState({
          ...defaultAvailabilityFields,
          unlisted: true
        })
      }
    },
    [didUpdateState]
  )

  const updateHiddenField = useCallback(
    (field: string) => (visible: boolean) => {
      didUpdateState({
        ...metadataState,
        [field]: visible
      })
    },
    [didUpdateState]
  )

  const updatePremiumContentFields = useCallback(
    (premiumConditions: PremiumConditions) => {
      didUpdateState({
        ...metadataState,
        premium_conditions: premiumConditions
      })
    },
    [didUpdateState]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      wrapperClassName={styles.modalWrapper}
    >
      <ModalHeader
        className={styles.modalHeader}
        onClose={onClose}
        dismissButtonClassName={styles.modalHeaderDismissButton}
      >
        <ModalTitle
          title={messages.title}
          icon={<IconHidden className={styles.modalTitleIcon} />}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <PublicAvailability
          selected={availability === AvailabilityType.PUBLIC}
          metadataState={metadataState}
          handleSelection={handleSelection}
        />
        {isSpecialAccessGateEnabled && (
          <SpecialAccessAvailability
            selected={availability === AvailabilityType.SPECIAL_ACCESS}
            metadataState={metadataState}
            handleSelection={handleSelection}
            updatePremiumContentFields={updatePremiumContentFields}
          />
        )}
        {isNFTGateEnabled && (
          <CollectibleGatedAvailability
            selected={availability === AvailabilityType.COLLECTIBLE_GATED}
            metadataState={metadataState}
            handleSelection={handleSelection}
            updatePremiumContentFields={updatePremiumContentFields}
          />
        )}
        <HiddenAvailability
          selected={availability === AvailabilityType.HIDDEN}
          metadataState={metadataState}
          handleSelection={handleSelection}
          updateHiddenField={updateHiddenField}
        />
        <div className={styles.doneButtonContainer}>
          <Button
            type={ButtonType.PRIMARY_ALT}
            textClassName={cn(styles.doneButton)}
            text={messages.done}
            onClick={onClose}
          />
        </div>
      </ModalContent>
    </Modal>
  )
}

export default TrackAvailabilityModal
