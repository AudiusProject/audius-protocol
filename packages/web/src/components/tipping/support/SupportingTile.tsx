import React, { useCallback } from 'react'

import { IconTrophy } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import profilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import { SquareSizes, WidthSizes } from 'common/models/ImageSizes'
import { Supporting } from 'common/models/Tipping'
import { User } from 'common/models/User'
import { getUser } from 'common/store/cache/users/selectors'
import { Nullable } from 'common/utils/typeUtils'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './Support.module.css'

const messages = {
  supporter: 'SUPPORTER'
}

type SupportingCardProps = {
  supporting: Supporting
}
export const SupportingTile = ({ supporting }: SupportingCardProps) => {
  const receiver = useSelector<AppState, Nullable<User>>(state =>
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
    <div className={styles.tileContainer} onClick={handleClick}>
      <div className={styles.tileBackground}>
        <img className={styles.coverPhoto} src={coverPhoto} />
        <div>
          <img className={styles.profilePicture} src={profileImage} />
          <div className={styles.name}>
            {receiver.name}
            <UserBadges
              className={styles.badge}
              userId={receiver.user_id}
              badgeSize={12}
            />
          </div>
        </div>
      </div>
      {isTopRank ? (
        <div className={cn(styles.tileHeader, styles.topFive)}>
          <IconTrophy className={styles.trophyIcon} />
          <span>
            #{rank} {messages.supporter}
          </span>
        </div>
      ) : (
        <div className={styles.tileHeader}>
          <IconTip className={styles.tipIcon} />
          <span>{messages.supporter}</span>
        </div>
      )}
    </div>
  ) : null
}
