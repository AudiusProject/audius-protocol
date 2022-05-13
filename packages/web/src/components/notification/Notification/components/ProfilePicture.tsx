import React, { useCallback, useEffect, useState } from 'react'

import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { SquareSizes } from 'common/models/ImageSizes'
import { User } from 'common/models/User'
import ArtistPopover from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './ProfilePicture.module.css'

const imageLoadDelay = 250

type ProfilePictureProps = {
  user: User
  className?: string
  disablePopover?: boolean
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const { user, className, disablePopover } = props
  const { user_id, _profile_picture_sizes, handle } = user
  const [loadImage, setLoadImage] = useState(false)
  const dispatch = useDispatch()
  const profilePicture = useUserProfilePicture(
    user_id,
    _profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150,
    undefined,
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

  const handleClick = useCallback(() => {
    dispatch(push(`/${handle}`))
  }, [dispatch, handle])

  const profilePictureElement = (
    <DynamicImage
      onClick={handleClick}
      wrapperClassName={cn(styles.profilePictureWrapper, className)}
      className={styles.profilePicture}
      image={profilePicture}
    />
  )

  if (disablePopover) return profilePictureElement

  return (
    <ArtistPopover handle={user.handle} component='span'>
      {profilePictureElement}
    </ArtistPopover>
  )
}
