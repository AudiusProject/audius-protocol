import { useCallback } from 'react'

import {
  gatedContentActions,
  useLockedContent,
  useGatedContentAccess
} from '@audius/common'
import { IconLock, ModalContent, ModalHeader, ModalTitle } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { GatedTrackSection } from 'components/track/GatedTrackSection'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'

import styles from './LockedContentModal.module.css'

const { resetLockedContentId } = gatedContentActions

const messages = {
  howToUnlock: 'HOW TO UNLOCK'
}

export const LockedContentModal = () => {
  const [isOpen, setIsOpen] = useModalState('LockedContent')
  const dispatch = useDispatch()
  const { track, owner } = useLockedContent()
  const { doesUserHaveAccess } = useGatedContentAccess(track)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    dispatch(resetLockedContentId())
  }, [setIsOpen, dispatch])

  const mobile = isMobile()

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
        className={cn(styles.modalHeader, { [styles.mobile]: mobile })}
        onClose={handleClose}
        dismissButtonClassName={styles.modalHeaderDismissButton}
        showDismissButton={!mobile}
      >
        <ModalTitle
          title={messages.howToUnlock}
          icon={<IconLock className={styles.modalTitleIcon} />}
        />
      </ModalHeader>
      <ModalContent>
        {track && track.stream_conditions && owner && (
          <div className={styles.modalContent}>
            <LockedTrackDetailsTile track={track} owner={owner} />
            <GatedTrackSection
              isLoading={false}
              trackId={track.track_id}
              streamConditions={track.stream_conditions}
              doesUserHaveAccess={doesUserHaveAccess}
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
