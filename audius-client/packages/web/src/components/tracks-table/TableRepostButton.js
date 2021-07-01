import React, { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconRepost } from 'assets/img/iconRepost.svg'
import Toast from 'components/toast/Toast'

import styles from './TableRepostButton.module.css'

const REPOST_TIMEOUT = 1000

class TableRepostButton extends Component {
  render() {
    const { reposted, onClick, className } = this.props

    return (
      <div
        onClick={onClick}
        className={cn(styles.tableRepostButton, className, 'tableRepostButton')}
      >
        <Toast
          text={'Reposted!'}
          disabled={reposted}
          delay={REPOST_TIMEOUT}
          containerClassName={styles.iconContainer}
        >
          {reposted ? (
            <IconRepost className={cn(styles.icon, styles.reposted)} />
          ) : (
            <IconRepost className={cn(styles.icon, styles.notReposted)} />
          )}
        </Toast>
      </div>
    )
  }
}

TableRepostButton.propTypes = {
  reposted: PropTypes.bool,
  onClick: PropTypes.func
}

TableRepostButton.defaultProps = {
  reposted: false
}

export default TableRepostButton
