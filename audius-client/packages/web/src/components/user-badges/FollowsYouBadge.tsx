import React from 'react'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './FollowsYouBadge.module.css'

const messages = {
  followsYou: 'Follows You'
}

export default function FollowsYouBadge() {
  const wm = useWithMobileStyle(styles.mobile)
  return <div className={wm(styles.badge)}>{messages.followsYou}</div>
}
