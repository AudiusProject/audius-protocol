import React, { useState, useCallback } from 'react'
import clsx from 'clsx'
import styles from './DecreaseStakeModal.module.css'

type OwnProps = {
  className?: string
}

type DecreaseStakeModal = OwnProps

const DecreaseStakeModal: React.FC<DecreaseStakeModal> = ({ className }) => {
  return (
    <div className={clsx(styles.container, { [className!]: !!className })}>
      decreasde it!
    </div>
  )
}

export default DecreaseStakeModal
