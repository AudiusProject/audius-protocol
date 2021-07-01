import React from 'react'

import PropTypes from 'prop-types'

import styles from './SettingsCard.module.css'

const SettingsCard = props => {
  return (
    <div className={styles.settingsCard}>
      <div className={styles.content}>
        <div className={styles.title}>{props.title}</div>
        <div className={styles.description}>{props.description}</div>
      </div>
      {props.children}
    </div>
  )
}

SettingsCard.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node
}

export default SettingsCard
