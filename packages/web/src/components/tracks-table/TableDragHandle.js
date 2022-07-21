import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import { getCurrentThemeColors } from 'utils/theme/theme'

import styles from './TableDragHandle.module.css'

const TableDragHandle = (props) => {
  const { loading, ...otherProps } = props
  const themeColors = getCurrentThemeColors()

  return (
    <td className={styles.tableDragHandle} {...otherProps}>
      <div className={styles.wrapper}>
        {!loading && (
          <IconDrag
            className={styles.iconDrag}
            color={themeColors['--neutral']}
          />
        )}
      </div>
    </td>
  )
}

export default TableDragHandle
