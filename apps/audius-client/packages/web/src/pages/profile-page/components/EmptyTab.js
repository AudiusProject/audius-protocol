import React from 'react'

import PropTypes from 'prop-types'

import styles from './EmptyTab.module.css'

const EmptyTab = props => {
  const text = props.isOwner
    ? `You haven't ${props.text} yet...`
    : `${props.name} hasn’t ${props.text} yet...`
  return (
    <div className={styles.emptyTab}>
      {text} <i className='emoji thinking-face' />
    </div>
  )
}

EmptyTab.propTypes = {
  isOwner: PropTypes.bool,
  name: PropTypes.string,
  text: PropTypes.string
}

export default React.memo(EmptyTab)
