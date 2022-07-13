import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'

import styles from './TableDragHandle.module.css'

const TableDragHandle = (props) => {
  const { loading, ...otherProps } = props
  return (
    <td className={styles.tableDragHandle} {...otherProps}>
      <div className={styles.wrapper}>
        {!loading && <IconDrag className={styles.iconDrag} />}
      </div>
    </td>
  )
}

export default TableDragHandle
