import { HarmonyPlainButton, HarmonyPlainButtonType } from '@audius/stems'
import PropTypes from 'prop-types'

import IconArrow from 'assets/img/iconCaretLeft.svg'

import styles from './BackButton.module.css'

const BackButton = (props) => {
  return (
    <HarmonyPlainButton
      className={styles.backButton}
      variant={HarmonyPlainButtonType.SUBDUED}
      iconLeft={IconArrow}
      onClick={props.onClickBack}
      type='button'
    />
  )
}

BackButton.propTypes = {
  className: PropTypes.string,
  light: PropTypes.bool,
  onClickBack: PropTypes.func
}

export default BackButton
