import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import { ReactComponent as IconNext } from 'assets/img/pbIconNext.svg'

import styles from './PlayBarButton.module.css'

class NextButton extends Component {
  render() {
    return (
      <button
        className={cn(styles.button, {
          [styles.buttonFixedSize]: this.props.isMobile,
          [styles.previousNext]: this.props.isMobile
        })}
        onClick={this.props.onClick}
      >
        <IconNext className={styles.noAnimation} />
      </button>
    )
  }
}

NextButton.propTypes = {
  onClick: PropTypes.func,
  isMobile: PropTypes.bool
}

export default NextButton
