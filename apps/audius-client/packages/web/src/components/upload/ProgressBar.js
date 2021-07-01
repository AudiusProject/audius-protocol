import React, { Component } from 'react'

import Progress from 'antd/lib/progress'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './ProgressBar.module.css'

class ProgressBar extends Component {
  render() {
    const { percent, status } = this.props

    const isError = status === 'exception'

    return (
      <div
        className={cn(styles.progressBar, {
          [styles.complete]: !isError && percent >= 100
        })}
      >
        <Progress percent={percent} status={status} showInfo={false} />
      </div>
    )
  }
}

ProgressBar.propTypes = {
  percent: PropTypes.number,
  status: PropTypes.oneOf(['active', 'normal', 'exception'])
}

ProgressBar.defaultProps = {
  percent: 50,
  status: 'normal'
}

export default ProgressBar
