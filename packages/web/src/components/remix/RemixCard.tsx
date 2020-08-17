import React from 'react'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Remix } from 'models/Track'
import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import { Size } from 'components/co-sign/types'

import styles from './RemixCard.module.css'
import CoSign from 'components/co-sign/CoSign'
import ArtistPopover from 'components/artist/ArtistPopover'

const messages = {
  by: 'By '
}

type RemixCardProps = {
  profilePictureImage: string
  coverArtImage: string
  coSign?: Remix | null
  artistName: string
  artistHandle: string
  isVerified: boolean
  onClick: () => void
  onClickArtistName: () => void
}

const RemixCard = ({
  profilePictureImage,
  coverArtImage,
  coSign,
  artistName,
  artistHandle,
  isVerified,
  onClick,
  onClickArtistName
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
            isVerified={coSign.user.isVerified}
            hasFavorited={coSign.has_remix_author_saved}
            hasReposted={coSign.has_remix_author_reposted}
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
          </div>
        </ArtistPopover>
        {isVerified && <IconVerified className={styles.iconVerified} />}
      </div>
    </div>
  )
}

export default RemixCard
