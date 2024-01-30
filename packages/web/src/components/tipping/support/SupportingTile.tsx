import { useCallback } from 'react'

import {
  Nullable,
  cacheUsersSelectors,
  imageCoverPhotoBlank,
  imageProfilePicEmpty as profilePicEmpty
} from '@audius/common'
import {
  SquareSizes,
  WidthSizes,
  Supporting,
  User
} from '@audius/common/models'
import { IconTrophy } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './SupportingTile.module.css'
const { getUser } = cacheUsersSelectors

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
  const { source: coverPhoto, shouldBlur } =
    useCoverPhoto(receiver?.user_id ?? null, WidthSizes.SIZE_640) ||
    imageCoverPhotoBlank

  const handleClick = useCallback(() => {
    dispatch(pushRoute(`/${handle}`))
  }, [dispatch, handle])

  return receiver ? (
    <div
      className={cn(styles.tileContainer, styles.tileBackground)}
      css={{
        backgroundImage: `url(${coverPhoto}), linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.1) 50%,
          rgba(0, 0, 0, 0.3) 100%
        )`,
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          ...(shouldBlur
            ? {
                backdropFilter: 'blur(25px)'
              }
            : undefined)
        },
        overflow: 'hidden'
      }}
      onClick={handleClick}
    >
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
