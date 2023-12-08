import IconVerified from '../../assets/img/iconVerified.svg'
import { getCopyableLink } from '../../util/shareUtil'

import styles from './Titles.module.css'

const Titles = ({ title, handle, artistName, titleUrl, isVerified }) => {
  const onClickTitle = () => {
    window.open(getCopyableLink(titleUrl), '_blank')
  }

  const onClickArtist = () => {
    window.open(getCopyableLink(handle), '_blank')
  }

  return (
    <div className={styles.titles}>
      <h1 className={styles.title} onClick={onClickTitle}>
        {title}
      </h1>
      <h2 className={styles.artistName} onClick={onClickArtist}>
        {artistName}
        {isVerified && <IconVerified />}
      </h2>
    </div>
  )
}

export default Titles
