import { ReactNode } from 'react'

import styles from './ProfilePage.module.css'

type EmptyTabProps = {
  message: ReactNode
}

export const EmptyTab = (props: EmptyTabProps) => {
  return <div className={styles.emptyTab}>{props.message}</div>
}
