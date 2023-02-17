import { useCallback, useMemo } from 'react'

import {
  FeatureFlags,
  PremiumConditions,
  accountSelectors,
  TrackAvailabilityType,
  collectiblesSelectors,
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

import { ReactComponent as IconQuestionCircle } from 'assets/img/iconQuestionCircle.svg'
import { ModalRadioGroup } from 'components/modal-radio/ModalRadioGroup'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useFlag } from 'hooks/useRemoteConfig'

import { CollectibleGatedAvailability } from './CollectibleGatedAvailability'
import { HiddenAvailability } from './HiddenAvailability'
import { PublicAvailability } from './PublicAvailability'
import { SpecialAccessAvailability } from './SpecialAccessAvailability'
import styles from './TrackAvailabilityModal.module.css'
import { TrackMetadataState } from './types'

const { getUserId } = accountSelectors
const { getVerifiedUserCollections } = collectiblesSelectors

const messages = {
  title: 'AVAILABILITY',
  isRemix:
    'This track is marked as a remix. To enable additional availability options, unmark within Remix Settings.',
  done: 'Done'
}

const defaultAvailabilityFields = {
  is_premium: false,
  premium_conditions: null,
  unlisted: false,
  genre: true,
  mood: true,
  tags: true,
  plays: true,
  share: true
}

type TrackAvailabilityModalProps = {
  isOpen: boolean
  isRemix: boolean
  isUpload: boolean
  metadataState: TrackMetadataState
  didUpdateState: (newState: TrackMetadataState) => void
  onClose: () => void
}

// A modal that allows you to set a track as collectible-gated, special access, or unlisted,
// as well as toggle individual unlisted metadata field visibility.
const TrackAvailabilityModal = ({
  isOpen,
  isRemix,
  isUpload,
  metadataState,
  didUpdateState,
  onClose
}: TrackAvailabilityModalProps) => {
  const { isEnabled: isNFTGateEnabled } = useFlag(FeatureFlags.NFT_GATE_ENABLED)
  const { isEnabled: isSpecialAccessGateEnabled } = useFlag(
    FeatureFlags.SPECIAL_ACCESS_GATE_ENABLED
  )
  const { ethCollectionMap, solCollectionMap } = useSelector(
    getVerifiedUserCollections
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  const hasNoCollectibles = numEthCollectibles + numSolCollectibles === 0
  const noCollectibleGate = hasNoCollectibles || isRemix || !isUpload
  const noSpecialAccess = isRemix || !isUpload

  const accountUserId = useSelector(getUserId)
  const defaultSpecialAccess = useMemo(
    () => (accountUserId ? { follow_user_id: accountUserId } : null),
    [accountUserId]
  )

  let availability = TrackAvailabilityType.PUBLIC
  if (
    metadataState.is_premium &&
    metadataState.premium_conditions &&
    'nft_collection' in metadataState.premium_conditions
  ) {
    availability = TrackAvailabilityType.COLLECTIBLE_GATED
  } else if (metadataState.is_premium) {
    availability = TrackAvailabilityType.SPECIAL_ACCESS
  } else if (metadataState.unlisted) {
    availability = TrackAvailabilityType.HIDDEN
  }

  const updatePublicField = useCallback(() => {
    didUpdateState({ ...defaultAvailabilityFields })
  }, [didUpdateState])

  const updatePremiumContentFields = useCallback(
    (
      premiumConditions: Nullable<PremiumConditions>,
      availabilityType: TrackAvailabilityType
    ) => {
      if (premiumConditions) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true,
          premium_conditions: premiumConditions
        })
      } else if (availabilityType === availability) {
      } else if (availabilityType === TrackAvailabilityType.SPECIAL_ACCESS) {
        didUpdateState({
          ...defaultAvailabilityFields,
          is_premium: true,
          premium_conditions: defaultSpecialAccess
        })
      } else if (availabilityType === TrackAvailabilityType.COLLECTIBLE_GATED) {
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
      unlisted: true,
      plays: false,
      share: false
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

  const noOp = useCallback(() => {}, [])

  const handleSelectionClick = useCallback(
    (availability: TrackAvailabilityType) => {
      if (availability === TrackAvailabilityType.PUBLIC) {
        return updatePublicField
      }
      if (
        availability === TrackAvailabilityType.SPECIAL_ACCESS ||
        availability === TrackAvailabilityType.COLLECTIBLE_GATED
      ) {
        return () => {
          updatePremiumContentFields(null, availability)
        }
      }
      if (availability === TrackAvailabilityType.HIDDEN) {
        return updateUnlistedField
      }
      return noOp
    },
    [noOp, updatePublicField, updatePremiumContentFields, updateUnlistedField]
  )

  const radioItems = [
    <ModalRadioItem
      key='public'
      selected={availability === TrackAvailabilityType.PUBLIC}
      onClick={handleSelectionClick(TrackAvailabilityType.PUBLIC)}
    >
      <PublicAvailability
        selected={availability === TrackAvailabilityType.PUBLIC}
        state={metadataState}
        onStateUpdate={() => {}}
      />
    </ModalRadioItem>
  ]
  if (isSpecialAccessGateEnabled) {
    radioItems.push(
      <ModalRadioItem
        key='special-access'
        selected={availability === TrackAvailabilityType.SPECIAL_ACCESS}
        onClick={
          noSpecialAccess
            ? noOp
            : handleSelectionClick(TrackAvailabilityType.SPECIAL_ACCESS)
        }
        disabled={noSpecialAccess}
      >
        <SpecialAccessAvailability
          selected={availability === TrackAvailabilityType.SPECIAL_ACCESS}
          state={metadataState}
          onStateUpdate={updatePremiumContentFields}
          disabled={noSpecialAccess}
        />
      </ModalRadioItem>
    )
  }
  if (isNFTGateEnabled) {
    radioItems.push(
      <ModalRadioItem
        key='collectible-gated'
        selected={availability === TrackAvailabilityType.COLLECTIBLE_GATED}
        onClick={
          noCollectibleGate
            ? noOp
            : handleSelectionClick(TrackAvailabilityType.COLLECTIBLE_GATED)
        }
        disabled={noCollectibleGate}
      >
        <CollectibleGatedAvailability
          selected={availability === TrackAvailabilityType.COLLECTIBLE_GATED}
          state={metadataState}
          onStateUpdate={updatePremiumContentFields}
          disabled={noCollectibleGate}
        />
      </ModalRadioItem>
    )
  }
  radioItems.push(
    <ModalRadioItem
      key='hidden'
      selected={availability === TrackAvailabilityType.HIDDEN}
      onClick={handleSelectionClick(TrackAvailabilityType.HIDDEN)}
    >
      <HiddenAvailability
        selected={availability === TrackAvailabilityType.HIDDEN}
        state={metadataState}
        onStateUpdate={updateHiddenField}
      />
    </ModalRadioItem>
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
      <ModalContent>
        {isRemix && (
          <div className={styles.isRemix}>
            <IconQuestionCircle className={styles.isRemixIcon} />
            <div>{messages.isRemix}</div>
          </div>
        )}
        <ModalRadioGroup items={radioItems} />
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
