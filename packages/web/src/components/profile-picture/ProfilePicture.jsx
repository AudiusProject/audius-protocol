import { memo, useState, useEffect, useMemo } from 'react'

import { useUser, useUserCreatedCoins } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { SquareSizes } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { useTheme } from '@audius/harmony'
import cn from 'classnames'
import Lottie from 'lottie-react'
import PropTypes from 'prop-types'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import { useProfilePicture } from 'hooks/useProfilePicture'
import { env } from 'services/env'

import styles from './ProfilePicture.module.css'

const messages = {
  profilePicAltText: 'User Profile Picture'
}

const ProfilePicture = ({
  editMode = true,
  userId,
  profilePictureSizes,
  updatedProfilePicture,
  onDrop,
  showEdit = false,
  isMobile = false,
  loading = false,
  url,
  error,
  includePopup = true,
  hasProfilePicture
}) => {
  const image = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_480_BY_480
  })
  const [hasChanged, setHasChanged] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const { isEnabled: isArtistCoinEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: artistCoinBadge } = useUser(userId, {
    select: (user) => user?.artist_coin_badge
  })

  const { data: ownedCoins } = useUserCreatedCoins({ userId, limit: 1 })

  const shouldShowArtistCoinBadge = useMemo(() => {
    if (
      !isArtistCoinEnabled ||
      !artistCoinBadge?.mint ||
      !artistCoinBadge?.logo_uri
    ) {
      return false
    }

    // Don't show for wAUDIO
    if (artistCoinBadge.mint === env.WAUDIO_MINT_ADDRESS) {
      return false
    }

    // Only show if the user actually owns this coin (not just holds it)
    const ownedCoin = ownedCoins?.[0]
    return ownedCoin?.mint === artistCoinBadge.mint
  }, [
    isArtistCoinEnabled,
    artistCoinBadge.mint,
    artistCoinBadge?.logo_uri,
    ownedCoins
  ])

  useEffect(() => {
    if (editMode) {
      setHasChanged(false)
    }
  }, [editMode])

  const onSelect = async (file, source) => {
    setProcessing(true)
    const image = await file
    await onDrop([].concat(image), source)
    setHasChanged(true)
    setProcessing(false)
  }

  const onClick = () => {
    setModalOpen(true)
  }

  const onClose = () => {
    setModalOpen(false)
  }

  const { color } = useTheme()

  return (
    <div
      className={cn(styles.profilePictureWrapper, {
        [styles.editMode]: editMode,
        [styles.hasChanged]: hasChanged,
        [styles.modalOpen]: modalOpen,
        [styles.isMobile]: isMobile
      })}
    >
      <div className={styles.profilePictureBackground}>
        <DynamicImage
          alt={messages.profilePicAltText}
          usePlaceholder={false}
          image={updatedProfilePicture || image}
          skeletonClassName={styles.profilePictureSkeleton}
          wrapperClassName={styles.profilePicture}
        >
          {editMode && (
            <div
              className={cn(styles.overlay, {
                [styles.processing]: processing
              })}
            >
              <Lottie loop autoplay animationData={loadingSpinner} />
            </div>
          )}
        </DynamicImage>
        {editMode || showEdit ? (
          <ImageSelectionButton
            wrapperClassName={styles.imageSelectionButtonWrapper}
            buttonClassName={styles.imageSelectionButton}
            onSelect={onSelect}
            onClick={onClick}
            onAfterClose={onClose}
            includePopup={includePopup}
            error={!!error}
            hasImage={hasProfilePicture}
            source='ProfilePicture'
          />
        ) : null}
        {shouldShowArtistCoinBadge && (
          <TokenIcon
            logoURI={artistCoinBadge?.logo_uri}
            css={{ position: 'absolute', bottom: 0, right: 0, zIndex: 10 }}
            hex
            w={64}
            h={64}
            hexBorderColor={color.static.white}
          />
        )}
      </div>
    </div>
  )
}

ProfilePicture.propTypes = {
  userId: PropTypes.number,
  profilePictureSizes: PropTypes.object,
  updatedProfilePicture: PropTypes.string,
  isMobile: PropTypes.bool,
  showEdit: PropTypes.bool,
  editMode: PropTypes.bool.isRequired,
  // Whether or not the use has a non-default profile picture
  hasProfilePicture: PropTypes.bool.isRequired,
  includePopup: PropTypes.bool,
  loading: PropTypes.bool.isRequired,
  url: PropTypes.string,
  onDrop: PropTypes.func.isRequired
}

export default memo(ProfilePicture)
