import FullColorLogo from '../../assets/img/Horizontal-Logo-Full-Color.png'
import { getCopyableLink } from '../../util/shareUtil'

import styles from './TwitterFooter.module.css'

const messages = {
  title: 'Listen on'
}

const TwitterFooter = ({ onClickPath }) => {
  const onClick = () => window.open(getCopyableLink(onClickPath), '_blank')

  return (
    <div className={styles.container} onClick={onClick}>
      <div>{messages.title}</div>
      <div
        style={{ background: `url(${FullColorLogo})` }}
        className={styles.logo}
      />
    </div>
  )
}

export default TwitterFooter
