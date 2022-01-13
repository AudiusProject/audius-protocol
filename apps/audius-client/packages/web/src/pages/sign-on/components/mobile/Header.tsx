import React from 'react'

import { ReactComponent as Logo } from 'assets/img/audiusLogoHorizontal.svg'

import styles from './Header.module.css'

export const SignOnHeader = () => {
  return (
    <div className={styles.container}>
      <Logo className={styles.img} />
    </div>
  )
}

export default SignOnHeader
