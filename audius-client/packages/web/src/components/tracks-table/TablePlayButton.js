import React, { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconPause } from 'assets/img/pbIconPause.svg'
import { ReactComponent as IconPlay } from 'assets/img/pbIconPlay.svg'

import styles from './TablePlayButton.module.css'

class TablePlayButton extends Component {
  render() {
    const { paused, playing, onClick, hideDefault, className } = this.props

    return (
      <div onClick={onClick} className={cn(styles.tablePlayButton, className)}>
        {playing && !paused ? (
          <div>
            <IconPause className={styles.icon} />
          </div>
        ) : (
          <div>
            <IconPlay
              className={cn(styles.icon, {
                [styles.hideDefault]: hideDefault && !playing
              })}
            />
          </div>
        )}
      </div>
    )
  }
}

TablePlayButton.propTypes = {
  playing: PropTypes.bool,
  onClick: PropTypes.func,
  hideDefault: PropTypes.bool
}

TablePlayButton.defaultProps = {
  playing: false,
  hideDefault: true
}

export default TablePlayButton
