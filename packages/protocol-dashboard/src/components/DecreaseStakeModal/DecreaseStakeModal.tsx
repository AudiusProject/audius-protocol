import React from 'react'

import clsx from 'clsx'

import styles from './DecreaseStakeModal.module.css'

type DecreaseStakeModalProps = {
  className?: string
}

const DecreaseStakeModal: React.FC<DecreaseStakeModalProps> = ({
  className
}) => {
  return (
    <div className={clsx(styles.container, { [className!]: !!className })}>
      decreasde it!
    </div>
  )
}

export default DecreaseStakeModal
