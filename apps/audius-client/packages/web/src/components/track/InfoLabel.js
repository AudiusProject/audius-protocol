import { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './InfoLabel.module.css'

class InfoLabel extends Component {
  render() {
    const { labelName, labelValue, className } = this.props

    return (
      <div className={cn(className, styles.infoLabel)}>
        <h2 className={styles.labelName}>{labelName}</h2>
        <h2 className={styles.labelValue}>{labelValue}</h2>
      </div>
    )
  }
}

InfoLabel.propTypes = {
  labelName: PropTypes.string,
  labelValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  className: PropTypes.string
}

InfoLabel.defaultProps = {
  labelName: 'released',
  labelValue: '12/12/18'
}

export default InfoLabel
