import { useCallback } from 'react'

import { imageCoverPhotoBlank } from '@audius/common/assets'
import {
  SquareSizes,
  WidthSizes,
  Supporting,
  User
} from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { IconTrophy } from '@audius/harmony'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
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
  const profileImage = useProfilePicture({
    userId: receiver?.user_id,
    size: SquareSizes.SIZE_150_BY_150
  })
  const coverPhoto = useCoverPhoto({
    userId: receiver?.user_id,
    size: WidthSizes.SIZE_640,
    defaultImage: imageCoverPhotoBlank
  })

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
          ...(coverPhoto === imageCoverPhotoBlank
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
