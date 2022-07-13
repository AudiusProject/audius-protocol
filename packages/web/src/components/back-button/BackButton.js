import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconArrow } from 'assets/img/iconArrow.svg'

import styles from './BackButton.module.css'

const BackButton = (props) => {
  return (
    <div
      className={cn(styles.backButton, props.className, {
        [styles.light]: props.light
      })}
      onClick={props.onClickBack}>
      <IconArrow />
    </div>
  )
}

BackButton.propTypes = {
  className: PropTypes.string,
  light: PropTypes.bool,
  onClickBack: PropTypes.func
}

export default BackButton
