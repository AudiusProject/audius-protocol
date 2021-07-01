import React from 'react'

import { Button, ButtonSize, ButtonType } from '@audius/stems'
import PropTypes from 'prop-types'

import styles from './ConfirmationBox.module.css'

const ConfirmationBox = props => {
  return (
    <div className={styles.confirmationBox}>
      <div className={styles.text}>{props.text}</div>
      <div className={styles.buttons}>
        <Button
          text={props.leftText}
          name={props.leftName}
          size={ButtonSize.MEDIUM}
          type={ButtonType.COMMON}
          onClick={props.leftClick}
        />
        <Button
          text={props.rightText}
          name={props.rightName}
          size={ButtonSize.MEDIUM}
          type={ButtonType.PRIMARY_ALT}
          onClick={props.rightClick}
        />
      </div>
    </div>
  )
}

ConfirmationBox.propTypes = {
  text: PropTypes.string,
  rightText: PropTypes.string,
  leftText: PropTypes.string,
  leftName: PropTypes.string,
  rightName: PropTypes.string,
  rightClick: PropTypes.func,
  leftClick: PropTypes.func
}

ConfirmationBox.defaultProps = {
  text: 'This might not be safe. Are you sure?',
  rightText: 'Yes',
  leftText: 'No',
  rightClick: () => {},
  leftClick: () => {}
}

export default ConfirmationBox
