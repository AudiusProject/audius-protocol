import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import { ReactComponent as IconPrev } from 'assets/img/pbIconPrev.svg'

import styles from './PlayBarButton.module.css'

class PreviousButton extends Component {
  render() {
    return (
      <button
        className={cn(styles.button, {
          [styles.buttonFixedSize]: this.props.isMobile,
          [styles.previousNext]: this.props.isMobile
        })}
        onClick={this.props.onClick}
      >
        <IconPrev className={styles.noAnimation} />
      </button>
    )
  }
}

PreviousButton.propTypes = {
  onClick: PropTypes.func,
  isMobile: PropTypes.bool
}

export default PreviousButton
