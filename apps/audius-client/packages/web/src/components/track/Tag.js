import React, { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Tag.module.css'

class Tag extends Component {
  render() {
    const { textLabel, className, onClick } = this.props

    const style = {
      [styles.clickable]: !!onClick
    }

    return (
      <div className={cn(className, styles.tag, style)} onClick={onClick}>
        <span className={styles.textLabel}>{textLabel}</span>
      </div>
    )
  }
}

Tag.propTypes = {
  textLabel: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func
}

Tag.defaultProps = {
  textLabel: 'Electronic'
}

export default Tag
