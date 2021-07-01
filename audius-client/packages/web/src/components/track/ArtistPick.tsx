import React from 'react'

import cn from 'classnames'

import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'

import styles from './ArtistPick.module.css'

const ArtistPick = ({
  isMobile,
  isMatrixMode
}: {
  isMobile?: boolean
  isMatrixMode: boolean
}) => {
  return (
    <div
      className={cn(styles.artistPick, {
        [styles.isMobile]: isMobile,
        [styles.matrix]: isMatrixMode
      })}
    >
      <div className={styles.container} />
      <IconStar />
    </div>
  )
}

export default ArtistPick
