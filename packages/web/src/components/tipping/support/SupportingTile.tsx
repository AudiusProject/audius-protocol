import { useCallback } from 'react'

import {
  SquareSizes,
  WidthSizes,
  Supporting,
  User,
  Nullable
} from '@audius/common'
import { IconTrophy } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import profilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import { getUser } from 'common/store/cache/users/selectors'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './SupportingTile.module.css'

type SupportingCardProps = {
  supporting: Supporting
}
export const SupportingTile = ({ supporting }: SupportingCardProps) => {
  const receiver = useSelector<AppState, Nullable<User>>((state) =>
    getUser(state, { id: supporting.receiver_id })
  )

  const dispatch = useDispatch()
  const { rank } = supporting
  const handle = receiver?.handle
  const isTopRank = rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD
  const profileImage =
    useUserProfilePicture(
      receiver?.user_id ?? null,
      receiver?._profile_picture_sizes ?? null,
      SquareSizes.SIZE_150_BY_150
    ) || profilePicEmpty
  const coverPhoto =
    useUserCoverPhoto(
      receiver?.user_id ?? null,
      receiver?._cover_photo_sizes ?? null,
      WidthSizes.SIZE_640
    ) || imageCoverPhotoBlank

  const handleClick = useCallback(() => {
    dispatch(pushRoute(`/${handle}`))
  }, [dispatch, handle])

  return receiver ? (
    <div
      className={cn(styles.tileContainer, styles.tileBackground)}
      style={{
        backgroundImage: `url(${coverPhoto}), linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.1) 50%,
          rgba(0, 0, 0, 0.3) 100%
        )`
      }}
      onClick={handleClick}>
      {isTopRank ? (
        <div className={cn(styles.tileHeader, styles.topFive)}>
          <IconTrophy className={styles.trophyIcon} />
          <span className={styles.rankNumberSymbol}>#</span>
          <span>{rank}</span>
        </div>
      ) : null}
      <div className={styles.profilePictureContainer}>
        <img className={styles.profilePicture} src={profileImage} />
        <span className={styles.name}>{receiver.name}</span>
        <UserBadges
          className={styles.badge}
          userId={receiver.user_id}
          badgeSize={12}
        />
      </div>
    </div>
  ) : null
}
