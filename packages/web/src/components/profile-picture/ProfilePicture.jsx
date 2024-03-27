import { memo, useState, useEffect } from 'react'

import { imageProfilePicEmpty } from '@audius/common/assets'
import { SquareSizes } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'
import { useSelector } from 'react-redux'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import ImageSelectionButton from 'components/image-selection/ImageSelectionButton'
import { StaticImage } from 'components/static-image/StaticImage'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { useSsrContext } from 'ssr/SsrContext'

import styles from './ProfilePicture.module.css'

const { getUser } = cacheUsersSelectors

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
  const image = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_480_BY_480
  )
  const [hasChanged, setHasChanged] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const user = useSelector((state) => getUser(state, { id: userId }))
  const { isSsrEnabled } = useSsrContext()

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

  const ImageElement = isSsrEnabled ? StaticImage : DynamicImage

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
        <ImageElement
          cid={user?.profile_picture_sizes}
          size={SquareSizes.SIZE_480_BY_480}
          imageUrl={
            updatedProfilePicture ||
            (!user?.profile_picture_sizes ? imageProfilePicEmpty : undefined)
          }
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
        </ImageElement>
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
