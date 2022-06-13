import { ReactNode } from 'react'

import styles from './GroupableList.module.css'

type GroupableListProps = {
  children: ReactNode
}

/**
 * A list component that can be used to render groupings of children.
 * See `Grouping` and `Row` components.
 * e.g.
 * ```
 *  <GroupableList>
 *    <Grouping>
 *      <Row />
 *      <Row />
 *    </Grouping>
 *  </GroupableList>
 * ```
 */
const GroupableList = ({ children }: GroupableListProps) => {
  return <div className={styles.groupableList}>{children}</div>
}

export default GroupableList
