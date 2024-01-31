import { ReactNode } from 'react'

import {
  IconAudiusLogo,
  useTheme,
  IconTipping as IconTipBase
} from '@audius/harmony'
import { IconCart as IconCartBase } from '@audius/stems'

import IconHeart from 'assets/img/iconHeart.svg'
import IconPlaylist from 'assets/img/iconPlaylists.svg'
import IconRemixBase from 'assets/img/iconRemix.svg'
import IconRepostBase from 'assets/img/iconRepost.svg'
import IconStars from 'assets/img/iconStars.svg'
import Tastemaker from 'assets/img/iconTastemaker.svg'
import IconTrendingBase from 'assets/img/iconTrending.svg'
import IconTrophy from 'assets/img/iconTrophy.svg'
import IconUser from 'assets/img/iconUser.svg'

import styles from './icons.module.css'

export const IconFollow = () => {
  return <IconUser className={styles.iconFollow} />
}

export const IconCart = () => {
  return <IconCartBase className={styles.iconCart} />
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

export const IconTastemaker = () => {
  return <Tastemaker className={styles.iconTrending} />
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
  const { spacing } = useTheme()
  return (
    <IconAudiusLogo size='l' color='accent' css={{ marginRight: spacing.s }} />
  )
}

export const IconAddTrackToPlaylist = () => {
  return <IconPlaylist className={styles.iconAddTrackToPlaylist} />
}
