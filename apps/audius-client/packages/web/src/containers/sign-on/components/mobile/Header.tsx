import React from 'react'
import styles from './Header.module.css'
import { ReactComponent as Logo } from 'assets/img/audiusLogoHorizontal.svg'

export const SignOnHeader = () => {
  return (
    <div className={styles.container}>
      <Logo className={styles.img} />
    </div>
  )
}

export default SignOnHeader
