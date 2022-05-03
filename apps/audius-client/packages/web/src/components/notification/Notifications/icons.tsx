import React from 'react'

import { ReactComponent as IconRepostBase } from 'assets/img/iconRepost.svg'
import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'

import styles from './icons.module.css'

export const IconFollow = () => {
  return <IconUser className={styles.iconFollow} />
}

export const IconRepost = () => {
  return <IconRepostBase className={styles.iconRepost} />
}
