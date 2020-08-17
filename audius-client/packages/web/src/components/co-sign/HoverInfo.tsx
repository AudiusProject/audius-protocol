import React from 'react'

import styles from './HoverInfo.module.css'

import { ReactComponent as IconHeart } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRepost } from 'assets/img/iconRepost.svg'
import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'

const messages = {
  coSign: 'Co-Sign',
  reposted: 'Reposted',
  favorited: 'Favorited',
  repostedAndFavorited: 'Reposted & Favorited'
}

type HoverInfoProps = {
  coSignName: string
  isVerified: boolean
  hasFavorited: boolean
  hasReposted: boolean
}

const HoverInfo = ({
  coSignName,
  isVerified,
  hasFavorited,
  hasReposted
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
            {isVerified && <IconVerified className={styles.iconVerified} />}
          </div>
          {text}
        </div>
      </div>
    </div>
  )
}

export default HoverInfo
