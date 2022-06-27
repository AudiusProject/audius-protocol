import { ReactNode } from 'react'

import { ReactComponent as IconAudius } from 'assets/img/iconAudius.svg'
import { ReactComponent as IconHeart } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconPlaylist } from 'assets/img/iconPlaylists.svg'
import { ReactComponent as IconRemixBase } from 'assets/img/iconRemix.svg'
import { ReactComponent as IconRepostBase } from 'assets/img/iconRepost.svg'
import { ReactComponent as IconStars } from 'assets/img/iconStars.svg'
import { ReactComponent as IconTipBase } from 'assets/img/iconTip.svg'
import { ReactComponent as IconTrendingBase } from 'assets/img/iconTrending.svg'
import { ReactComponent as IconTrophy } from 'assets/img/iconTrophy.svg'
import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'

import styles from './icons.module.css'

export const IconFollow = () => {
  return <IconUser className={styles.iconFollow} />
}

export const IconRepost = () => {
  return <IconRepostBase className={styles.iconRepost} />
}

export const IconFavorite = () => {
  return <IconHeart className={styles.iconFavorite} />
}

export const IconMilestone = () => {
  return <IconTrophy className={styles.iconMilestone} />
}

export const IconRelease = () => {
  return <IconStars className={styles.iconRelease} />
}

export const IconRewards = ({ children }: { children: ReactNode }) => {
  return <span className={styles.iconRewards}>{children}</span>
}

export const IconTrending = () => {
  return <IconTrendingBase className={styles.iconTrending} />
}

export const IconTier = ({ children }: { children: ReactNode }) => {
  return <span className={styles.iconTier}>{children}</span>
}

export const IconRemix = () => {
  return <IconRemixBase className={styles.iconRemix} />
}

export const IconTip = () => {
  return <IconTipBase className={styles.iconTip} />
}

export const IconAnnouncement = () => {
  return <IconAudius className={styles.iconAnnouncement} />
}

export const IconAddTrackToPlaylist = () => {
  return <IconPlaylist className={styles.iconAddTrackToPlaylist} />
}
