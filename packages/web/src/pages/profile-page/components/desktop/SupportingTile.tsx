import { useCallback } from 'react'

import {
  SquareSizes,
  WidthSizes,
  SupportedUserMetadata
} from '@audius/common/models'
import { IconTrophy } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { useProfilePicture } from 'hooks/useProfilePicture'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'
import { push } from 'utils/navigation'

import styles from './SupportingTile.module.css'

type SupportingCardProps = {
  supporting: SupportedUserMetadata
}
export const SupportingTile = ({ supporting }: SupportingCardProps) => {
  const { receiver, rank } = supporting
  const dispatch = useDispatch()
  const handle = receiver?.handle
  const isTopRank = rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD
  const profileImage = useProfilePicture({
    userId: receiver?.user_id,
    size: SquareSizes.SIZE_150_BY_150
  })
  const { image: coverPhoto, shouldBlur } = useCoverPhoto({
    userId: receiver?.user_id,
    size: WidthSizes.SIZE_640
  })

  const handleClick = useCallback(() => {
    dispatch(push(`/${handle}`))
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
