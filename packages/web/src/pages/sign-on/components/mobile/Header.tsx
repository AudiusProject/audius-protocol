import { IconAudiusLogoHorizontal } from '@audius/harmony'

import styles from './Header.module.css'

export const SignOnHeader = () => {
  return (
    <div className={styles.container}>
      <IconAudiusLogoHorizontal className={styles.img} />
    </div>
  )
}

export default SignOnHeader
