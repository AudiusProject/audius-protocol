import { ID, Remix } from '@audius/common/models'
import {} from '@audius/common'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import CoSign from 'components/co-sign/CoSign'
import { Size } from 'components/co-sign/types'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './RemixCard.module.css'

const messages = {
  by: 'By '
}

type RemixCardProps = {
  profilePictureImage?: string
  coverArtImage?: string
  coSign?: Remix | null
  artistName: string
  artistHandle: string
  onClick: () => void
  onClickArtistName: () => void
  userId: ID
}

const RemixCard = ({
  profilePictureImage,
  coverArtImage,
  coSign,
  artistName,
  artistHandle,
  onClick,
  onClickArtistName,
  userId
}: RemixCardProps) => {
  const images = (
    <div className={styles.images}>
      <div className={styles.profilePicture}>
        <DynamicImage image={profilePictureImage} />
      </div>
      <div className={styles.coverArt}>
        <DynamicImage image={coverArtImage} />
      </div>
    </div>
  )
  return (
    <div className={styles.remixCard}>
      <div className={styles.imagesContainer} onClick={onClick}>
        {coSign ? (
          <CoSign
            size={Size.MEDIUM}
            coSignName={coSign.user.name}
            hasFavorited={coSign.has_remix_author_saved}
            hasReposted={coSign.has_remix_author_reposted}
            userId={coSign.user?.user_id ?? 0}
          >
            {images}
          </CoSign>
        ) : (
          images
        )}
      </div>
      <div className={styles.artist} onClick={onClickArtistName}>
        <ArtistPopover handle={artistHandle}>
          <div className={styles.name}>
            <div className={styles.by}>{messages.by}</div>
            <div className={styles.hoverable}>{artistName}</div>
            <UserBadges
              className={styles.badges}
              userId={userId}
              badgeSize={12}
              inline
            />
          </div>
        </ArtistPopover>
      </div>
    </div>
  )
}

export default RemixCard
