import { useCallback } from 'react'

import {
  premiumContentActions,
  SquareSizes,
  Track,
  useLockedContent,
  usePremiumContentAccess,
  User
} from '@audius/common'
import {
  IconLock,
  ModalContent,
  ModalHeader,
  ModalTitle,
  IconCollectible,
  IconSpecialAccess
} from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { PremiumTrackSection } from 'components/track/PremiumTrackSection'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import styles from './LockedContentModal.module.css'

const { resetLockedContentId } = premiumContentActions

const messages = {
  howToUnlock: 'HOW TO UNLOCK',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS'
}

const TrackDetails = ({ track, owner }: { track: Track; owner: User }) => {
  const {
    track_id: trackId,
    title,
    premium_conditions: premiumConditions
  } = track
  const image = useTrackCoverArt(
    trackId,
    track._cover_art_sizes ?? null,
    SquareSizes.SIZE_150_BY_150,
    ''
  )
  const label = `${title} by ${owner.name}`
  const isCollectibleGated = !!premiumConditions?.nft_collection

  return (
    <div className={styles.trackDetails}>
      <DynamicImage
        wrapperClassName={styles.trackImageWrapper}
        className={styles.trackImage}
        image={image}
        aria-label={label}
      />
      <div>
        <div className={styles.premiumContentLabel}>
          {isCollectibleGated ? <IconCollectible /> : <IconSpecialAccess />}
          <span>
            {isCollectibleGated
              ? messages.collectibleGated
              : messages.specialAccess}
          </span>
        </div>
        <p className={styles.trackTitle}>{title}</p>
        <div className={styles.trackOwner}>
          <span className={styles.by}>By</span>
          <a className={styles.trackOwnerName} href={profilePage(owner.handle)}>
            {owner.name}
          </a>
          <UserBadges
            userId={owner.user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
            inline
          />
        </div>
      </div>
    </div>
  )
}

export const LockedContentModal = () => {
  const [isOpen, setIsOpen] = useModalState('LockedContent')
  const dispatch = useDispatch()
  const { track, owner } = useLockedContent()
  const { doesUserHaveAccess } = usePremiumContentAccess(track)

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
        {track && track.premium_conditions && owner && (
          <div>
            <TrackDetails track={track} owner={owner} />
            <PremiumTrackSection
              isLoading={false}
              trackId={track.track_id}
              premiumConditions={track.premium_conditions}
              doesUserHaveAccess={doesUserHaveAccess}
              isOwner={false}
              wrapperClassName={styles.premiumTrackSectionWrapper}
              className={styles.premiumTrackSection}
              buttonClassName={styles.premiumTrackSectionButton}
            />
          </div>
        )}
      </ModalContent>
    </ModalDrawer>
  )
}
