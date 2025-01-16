import { MouseEventHandler, useCallback } from 'react'

import { SquareSizes, User } from '@audius/common/models'
import { useNotificationModal } from '@audius/common/store'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useProfilePicture } from 'hooks/useProfilePicture'
import { push } from 'utils/navigation'

import styles from './ProfilePicture.module.css'

type ProfilePictureProps = {
  user: User
  className?: string
  innerClassName?: string
  disablePopover?: boolean
  disableClick?: boolean
  stopPropagation?: boolean
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const {
    user,
    className,
    innerClassName,
    disablePopover,
    disableClick,
    stopPropagation
  } = props
  const { user_id, handle } = user
  const dispatch = useDispatch()
  const { onClose } = useNotificationModal()
  const profilePicture = useProfilePicture({
    userId: user_id,
    size: SquareSizes.SIZE_150_BY_150
  })

  const handleClick: MouseEventHandler = useCallback(
    (e) => {
      if (stopPropagation) {
        e.stopPropagation()
      }
      if (!disableClick) {
        dispatch(push(`/${handle}`))
      }
    },
    [stopPropagation, disableClick, dispatch, handle]
  )

  const profilePictureElement = (
    <DynamicImage
      onClick={handleClick}
      wrapperClassName={cn(styles.profilePictureWrapper, className)}
      skeletonClassName={styles.profilePictureSkeleton}
      className={cn(styles.profilePicture, innerClassName)}
      image={profilePicture}
    />
  )

  if (disablePopover) return profilePictureElement

  return (
    <ArtistPopover
      handle={user.handle}
      component='span'
      onNavigateAway={onClose}
    >
      {profilePictureElement}
    </ArtistPopover>
  )
}
