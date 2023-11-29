import FullColorLogo from '../../assets/img/Horizontal-Logo-Full-Color.png'
import { getCopyableLink } from '../../util/shareUtil'

import styles from './AudiusLogo.module.css'

const AudiusLogo = () => {
  const onClick = () => {
    window.open(getCopyableLink(), '_blank')
  }

  return (
    <div
      className={styles.container}
      style={{ backgroundImage: `url(${FullColorLogo})` }}
      onClick={onClick}
    />
  )
}

export default AudiusLogo
