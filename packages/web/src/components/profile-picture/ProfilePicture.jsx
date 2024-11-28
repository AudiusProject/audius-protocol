import { memo, useState, useEffect } from 'react'

import { SquareSizes } from '@audius/common/models'
import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import { useProfilePicture } from 'hooks/useProfilePicture'

import styles from './ProfilePicture.module.css'

const messages = {
  profilePicAltText: 'User Profile Picture'
}

const ProfilePicture = ({
  editMode,
  userId,
  profilePictureSizes,
  updatedProfilePicture,
  onDrop,
  showEdit,
  isMobile,
  loading,
  url,
  error,
  includePopup,
  hasProfilePicture
}) => {
  const image = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_480_BY_480
  })
  const [hasChanged, setHasChanged] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

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
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: loadingSpinner
                }}
              />
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

ProfilePicture.defaultProps = {
  isMobile: false,
  showEdit: false,
  includePopup: true,
  editMode: true,
  loading: false
}

export default memo(ProfilePicture)
