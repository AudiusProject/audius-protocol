import { ID } from '@audius/common/models'
import {} from '@audius/common'

import IconHeart from 'assets/img/iconHeart.svg'
import IconRepost from 'assets/img/iconRepost.svg'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './HoverInfo.module.css'

const messages = {
  coSign: 'Co-Sign',
  reposted: 'Reposted',
  favorited: 'Favorited',
  repostedAndFavorited: 'Reposted & Favorited'
}

type HoverInfoProps = {
  coSignName: string
  hasFavorited: boolean
  hasReposted: boolean
  userId: ID
}

const HoverInfo = ({
  coSignName,
  hasFavorited,
  hasReposted,
  userId
}: HoverInfoProps) => {
  let icons
  let text

  if (hasFavorited && hasReposted) {
    icons = (
      <div className={styles.icons}>
        <IconRepost />
        <IconHeart />
      </div>
    )
    text = messages.repostedAndFavorited
  } else if (hasFavorited) {
    icons = (
      <div className={styles.icons}>
        <IconHeart />
      </div>
    )
    text = messages.favorited
  } else {
    icons = (
      <div className={styles.icons}>
        <IconRepost />
      </div>
    )
    text = messages.reposted
  }

  return (
    <div className={styles.hoverInfo}>
      <div className={styles.coSign}>{messages.coSign}</div>
      <div className={styles.body}>
        {icons}
        <div className={styles.text}>
          <div className={styles.name}>
            {coSignName}
            <UserBadges
              userId={userId}
              badgeSize={14}
              className={styles.iconVerified}
            />
          </div>
          {text}
        </div>
      </div>
    </div>
  )
}

export default HoverInfo
