import { MouseEventHandler, useCallback, useEffect, useState } from 'react'

import { SquareSizes, User } from '@audius/common/models'

import {} from '@audius/common'
import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { closeNotificationPanel } from 'store/application/ui/notifications/notificationsUISlice'

import styles from './ProfilePicture.module.css'

const imageLoadDelay = 250

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
  const { user_id, _profile_picture_sizes, handle } = user
  const [loadImage, setLoadImage] = useState(false)
  const dispatch = useDispatch()
  const profilePicture = useUserProfilePicture(
    user_id,
    _profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150,
    undefined,
    loadImage
  )

  // Loading the images immediately causes lag in the NotificationPanel animation
  useEffect(() => {
    if (!loadImage) {
      const t = setTimeout(() => {
        setLoadImage(true)
      }, imageLoadDelay)
      return () => clearTimeout(t)
    }
  }, [loadImage])

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

  const handleNavigateAway = useCallback(() => {
    dispatch(closeNotificationPanel())
  }, [dispatch])

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
      onNavigateAway={handleNavigateAway}
    >
      {profilePictureElement}
    </ArtistPopover>
  )
}
