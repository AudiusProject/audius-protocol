import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './TableLoadingSpinner.module.css'

export const TableLoadingSpinner = () => {
  return (
    <tr className={styles.row}>
      <td className={styles.item}>
        <LoadingSpinner className={styles.loader} />
      </td>
    </tr>
  )
}
