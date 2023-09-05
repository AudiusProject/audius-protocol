import PropTypes from 'prop-types'

import { ReactComponent as IconArrow } from 'assets/img/iconArrowGrey.svg'
import Banner from 'components/banner/Banner'
import Pill from 'components/pill/Pill'

import styles from './Web3ErrorBanner.module.css'

const META_MASK_SETUP_URL =
  'https://medium.com/@audius/configuring-metamask-for-use-with-audius-91e24bf6840'

const Web3ErrorBanner = (props) => {
  const onAccept = () => {
    const win = window.open(META_MASK_SETUP_URL, '_blank')
    win.focus()
  }

  return (
    <Banner alert {...props}>
      <div className={styles.web3ErrorBanner} onClick={onAccept}>
        <div className={styles.content}>
          <Pill
            text='Metamask Configured Incorrectly'
            className={styles.pill}
            textClassName={styles.pillText}
            showIcon={false}
            clickable={false}
          />
          <div className={styles.contentSelection}>
            <div className={styles.text}>Read The Configuration Guide</div>
            <IconArrow className={styles.arrow} />
          </div>
        </div>
      </div>
    </Banner>
  )
}

Web3ErrorBanner.propTypes = {
  onClose: PropTypes.func
}

export default Web3ErrorBanner
