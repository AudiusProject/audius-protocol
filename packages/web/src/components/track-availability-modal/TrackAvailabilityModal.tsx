import { useCallback, useMemo } from 'react'

import {
  FeatureFlags,
  PremiumConditions,
  accountSelectors,
  Nullable
} from '@audius/common'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  IconHidden,
  ButtonType,
  Button
} from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { useFlag } from 'hooks/useRemoteConfig'

import { CollectibleGatedAvailability } from './CollectibleGatedAvailability'
import { HiddenAvailability } from './HiddenAvailability'
import { PublicAvailability } from './PublicAvailability'
import { SpecialAccessAvailability } from './SpecialAccessAvailability'
import styles from './TrackAvailabilityModal.module.css'
import { AvailabilityType, TrackMetadataState } from './types'

const { getUserId } = accountSelectors

const messages = {
  title: 'AVAILABILITY',
  hideTrack: 'Hide Track',
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

type TrackAvailabilityModalProps = {
  isOpen: boolean
  metadataState: TrackMetadataState
  didUpdateState: (newState: TrackMetadataState) => void
  onClose: () => void
}

// A modal that allows you to set a track as collectible-gated, special access, or unlisted,
// as well as toggle individual unlisted metadata field visibility.
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

  const accountUserId = useSelector(getUserId)
  const defaultSpecialAccess = useMemo(
    () => (accountUserId ? { follow_user_id: accountUserId } : null),
    [accountUserId]
  )

  let availability = AvailabilityType.PUBLIC
  if (
    metadataState.is_premium &&
    metadataState.premium_conditions &&
    'nft_collection' in metadataState.premium_conditions
  ) {
    availability = AvailabilityType.COLLECTIBLE_GATED
  } else if (metadataState.is_premium) {
    availability = AvailabilityType.SPECIAL_ACCESS
  } else if (metadataState.unlisted) {
    availability = AvailabilityType.HIDDEN
  }

  const updatePublicField = useCallback(() => {
    didUpdateState({ ...defaultAvailabilityFields })
  }, [didUpdateState])

  const updatePremiumContentFields = useCallback(
    (
      premiumConditions: Nullable<PremiumConditions>,
      availabilityType: AvailabilityType
    ) => {
      if (premiumConditions) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true,
          premium_conditions: premiumConditions
        })
      } else if (availabilityType === availability) {
      } else if (availabilityType === AvailabilityType.SPECIAL_ACCESS) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true,
          premium_conditions: defaultSpecialAccess
        })
      } else if (availabilityType === AvailabilityType.COLLECTIBLE_GATED) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true,
          premium_conditions: { nft_collection: undefined }
        })
      }
    },
    [didUpdateState, availability, defaultSpecialAccess]
  )

  const updateUnlistedField = useCallback(() => {
    didUpdateState({
      ...defaultAvailabilityFields,
      unlisted: true
    })
  }, [didUpdateState])

  const updateHiddenField = useCallback(
    (field: string) => (visible: boolean) => {
      didUpdateState({
        ...metadataState,
        [field]: visible
      })
    },
    [didUpdateState, metadataState]
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
          updatePublicField={updatePublicField}
        />
        {isSpecialAccessGateEnabled && (
          <SpecialAccessAvailability
            selected={availability === AvailabilityType.SPECIAL_ACCESS}
            metadataState={metadataState}
            updatePremiumContentFields={updatePremiumContentFields}
          />
        )}
        {isNFTGateEnabled && (
          <CollectibleGatedAvailability
            selected={availability === AvailabilityType.COLLECTIBLE_GATED}
            metadataState={metadataState}
            updatePremiumContentFields={updatePremiumContentFields}
          />
        )}
        <HiddenAvailability
          selected={availability === AvailabilityType.HIDDEN}
          metadataState={metadataState}
          updateUnlistedField={updateUnlistedField}
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
