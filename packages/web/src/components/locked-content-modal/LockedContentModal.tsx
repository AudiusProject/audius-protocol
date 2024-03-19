import { useCallback } from 'react'

import { useGatedContentAccess, useLockedContent } from '@audius/common/hooks'
import {
  PurchaseableContentType,
  gatedContentActions
} from '@audius/common/store'
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  IconLock
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { GatedTrackSection } from 'components/track/GatedTrackSection'
import { LockedContentDetailsTile } from 'components/track/LockedContentDetailsTile'
import { useIsMobile } from 'hooks/useIsMobile'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'

import styles from './LockedContentModal.module.css'

const { resetLockedContentId } = gatedContentActions

const messages = {
  howToUnlock: 'HOW TO UNLOCK'
}

export const LockedContentModal = () => {
  const [isOpen, setIsOpen] = useModalState('LockedContent')
  const dispatch = useDispatch()
  const { track, owner } = useLockedContent()
  const { hasStreamAccess } = useGatedContentAccess(track)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    dispatch(resetLockedContentId())
  }, [setIsOpen, dispatch])

  const isMobile = useIsMobile()

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={handleClose}
      bodyClassName={styles.modalBody}
      dismissOnClickOutside
      isFullscreen={false}
      useGradientTitle={false}
    >
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: isMobile })}
        onClose={handleClose}
        dismissButtonClassName={styles.modalHeaderDismissButton}
        showDismissButton={!isMobile}
      >
        <ModalTitle
          title={messages.howToUnlock}
          icon={<IconLock className={styles.modalTitleIcon} />}
        />
      </ModalHeader>
      <ModalContent>
        {track && track.stream_conditions && owner && (
          <div className={styles.modalContent}>
            <LockedContentDetailsTile metadata={track} owner={owner} />
            <GatedTrackSection
              isLoading={false}
              // TODO: album support?
              contentId={track.track_id}
              contentType={PurchaseableContentType.TRACK}
              streamConditions={track.stream_conditions}
              hasStreamAccess={hasStreamAccess}
              isOwner={false}
              wrapperClassName={styles.gatedTrackSectionWrapper}
              className={styles.gatedTrackSection}
              buttonClassName={styles.gatedTrackSectionButton}
              ownerId={owner.user_id}
            />
          </div>
        )}
      </ModalContent>
    </ModalDrawer>
  )
}
