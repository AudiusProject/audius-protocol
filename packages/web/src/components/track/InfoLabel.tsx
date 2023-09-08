import { ReactElement } from 'react'

import cn from 'classnames'

import styles from './InfoLabel.module.css'

type InfoLabelProps = {
  className?: string
  labelName: string
  labelValue: string | ReactElement
}

const InfoLabel = (props: InfoLabelProps) => {
  const { labelName, labelValue, className } = props

  return (
    <div className={cn(className, styles.infoLabel)}>
      <h2 className={styles.labelName}>{labelName}</h2>
      <h2 className={styles.labelValue}>{labelValue}</h2>
    </div>
  )
}

export default InfoLabel
