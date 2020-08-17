import React, { ReactNode } from 'react'

import styles from './Grouping.module.css'

type GroupingProps = {
  children: ReactNode
}

/**
 * A grouping component to be used within a GroupableList.
 * Children are rendered out with padding. Generally, children should be <Row /> component.
 */
const Grouping = ({ children }: GroupingProps) => {
  return <div className={styles.grouping}>{children}</div>
}

export default Grouping
